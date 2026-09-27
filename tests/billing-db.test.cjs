const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { PGlite } = require('@electric-sql/pglite');

// Run the real migration/functions in an isolated PostgreSQL WASM database.
// No configured Supabase project or credentials are read by this suite.
test('billing migration enforces ownership, atomic deduplication and stale observation rejection', async () => {
  const db = new PGlite();
  try {
    await db.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    await db.exec(readFileSync(path.join(__dirname, '../supabase/migrations/20260926010000_billing_entitlements.sql'), 'utf8'));
    await db.exec('set role service_role;');
    await db.query('select public.runner_bind_billing_customer($1,$2,$3)', ['alice', 'cus_alice', 'acct_runner']);
    await db.query('select public.runner_bind_billing_customer($1,$2,$3)', ['bob', 'cus_bob', 'acct_runner']);
    await assert.rejects(db.query('select public.runner_bind_billing_customer($1,$2,$3)', ['alice', 'cus_bob', 'acct_runner']));
    await assert.rejects(db.query('select public.runner_bind_billing_customer($1,$2,$3)', ['alice', 'cus_alice', 'acct_foreign']));
    const begin = plan => db.query('select public.runner_checkout_begin($1,$2,$3) as attempt', ['alice', plan, 'price_' + plan]);
    const firstAttempt = (await begin('pro')).rows[0].attempt;
    assert.equal(firstAttempt.state, 'acquired');
    assert.equal((await begin('command')).rows[0].attempt.state, 'busy');
    await db.query('select public.runner_checkout_finish($1,$2,$3)', ['alice', firstAttempt.lease_token, null]);
    const retry = (await begin('pro')).rows[0].attempt;
    assert.equal(retry.attempt_id, firstAttempt.attempt_id, 'retry after a lost response retains Stripe idempotency identity');
    await assert.rejects(db.query('select public.runner_checkout_rotate($1,$2,$3,$4,$5)', ['alice', retry.lease_token, 'cs_unknown', 'command', 'price_command']));
    await db.query('select public.runner_checkout_finish($1,$2,$3)', ['alice', retry.lease_token, 'cs_recorded']);
    const next = (await begin('command')).rows[0].attempt;
    assert.equal(next.attempt_id, retry.attempt_id, 'no time bucket or new plan may rotate an existing attempt');
    const rotated = (await db.query('select public.runner_checkout_rotate($1,$2,$3,$4,$5) as attempt', ['alice', next.lease_token, 'cs_recorded', 'command', 'price_command'])).rows[0].attempt;
    assert.notEqual(rotated.attempt_id, next.attempt_id);
    await assert.rejects(db.query('select public.runner_checkout_finish($1,$2,$3)', ['alice', retry.lease_token, 'cs_other']), /lease or session mismatch/);
    await db.query('select public.runner_checkout_finish($1,$2,$3)', ['alice', rotated.lease_token, null]);
    await db.query("update public.runner_checkout_attempts set attempt_created_at=clock_timestamp()-interval '24 hours' where owner_user_id=$1", ['alice']);
    assert.equal((await begin('command')).rows[0].attempt.state, 'review_required', 'unknown attempts cannot outlive Stripe idempotency retention');
    const retained = await db.query('select attempt_id from public.runner_checkout_attempts where owner_user_id=$1', ['alice']);
    assert.equal(retained.rows[0].attempt_id, rotated.attempt_id);
    const apply = (id, customer, subscription, status, observed, account = 'acct_runner') => db.query(
      'select public.runner_apply_subscription_event($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) as outcome',
      [id, 'customer.subscription.updated', 10, customer, subscription, status, 'pro', '2030-01-01', observed, false, account],
    );
    assert.equal((await apply('evt_active', 'cus_alice', 'sub_alice', 'active', '2026-09-26T12:00:00Z')).rows[0].outcome, 'applied');
    assert.equal((await apply('evt_cancel', 'cus_alice', 'sub_alice', 'canceled', '2026-09-26T12:02:00Z')).rows[0].outcome, 'applied');
    assert.equal((await apply('evt_old', 'cus_alice', 'sub_alice', 'active', '2026-09-26T12:01:00Z')).rows[0].outcome, 'older_observation');
    assert.equal((await apply('evt_cancel', 'cus_alice', 'sub_alice', 'active', '2026-09-26T12:03:00Z')).rows[0].outcome, 'duplicate');
    assert.equal((await apply('evt_foreign', 'cus_alice', 'sub_alice', 'active', '2026-09-26T12:04:00Z', 'acct_foreign')).rows[0].outcome, 'unbound_customer');
    await assert.rejects(apply('evt_steal', 'cus_bob', 'sub_alice', 'active', '2026-09-26T12:05:00Z'), /ownership conflict/);
    const { rows } = await db.query('select owner_user_id,status from public.runner_billing_subscriptions where stripe_subscription_id=$1', ['sub_alice']);
    assert.deepEqual(rows, [{ owner_user_id: 'alice', status: 'canceled' }]);
    const audit = await db.query('select event_id,applied from public.runner_billing_events order by event_id');
    assert.deepEqual(audit.rows, [{ event_id: 'evt_active', applied: true }, { event_id: 'evt_cancel', applied: true }, { event_id: 'evt_old', applied: false }]);
    await db.exec('reset role; set role authenticated;');
    await assert.rejects(db.query('select * from public.runner_billing_subscriptions'), /permission denied/);
    await assert.rejects(db.query('select public.runner_bind_billing_customer($1,$2,$3)', ['mallory', 'cus_fake', 'acct_runner']), /permission denied/);
    await db.exec('reset role; set role anon;');
    await assert.rejects(db.query('select * from public.runner_billing_events'), /permission denied/);
  } finally { await db.close(); }
});
