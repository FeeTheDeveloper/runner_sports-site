const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

// Runs the real owner/access modules with the Clerk, Stripe and Supabase
// boundaries stubbed. The owner address here is a synthetic fixture on purpose:
// the production address lives only in RUNNER_OWNER_EMAIL, never in the repo.
const OWNER = 'owner@runner.test';

function loader(stubs, env) {
  const cache = new Map();
  function load(file) {
    file = path.resolve(root, file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const injectedRequire = (name) => {
      if (Object.hasOwn(stubs, name)) return stubs[name];
      if (name === 'server-only') return {};
      if (name.startsWith('@/')) return load(name.slice(2) + '.ts');
      return require(name);
    };
    vm.runInNewContext(code, { require: injectedRequire, module, exports: module.exports, process: { env }, Date, Response, URL, console }, { filename: file });
    return module.exports;
  }
  return load;
}

function accountFixture(email, { verified = true, metadata = {} } = {}) {
  return {
    id: 'clerk_' + email.split('@')[0],
    primaryEmailAddress: { emailAddress: email, verification: { status: verified ? 'verified' : 'unverified' } },
    privateMetadata: metadata,
  };
}

function harness({ env = {}, user = null, subscriptions = [], grants = [], billingUnavailable = false } = {}) {
  const counters = { billing: 0, database: 0 };
  const client = {
    from() {
      counters.database++;
      const query = {
        select: () => query,
        eq: () => query,
        is: () => query,
        then: (resolve, reject) => Promise.resolve({ data: grants, error: null }).then(resolve, reject),
      };
      return query;
    },
  };
  const load = loader({
    '@clerk/nextjs/server': { currentUser: async () => user },
    '@/lib/auth/config': { isClerkConfigured: () => true },
    '@/lib/supabase/server': { getSupabaseServerClient: () => client },
    '@/lib/billing/subscriptions': {
      isActiveSubscription: (row) => row.status === 'active' || row.status === 'trialing',
      getBillingSubscriptions: async () => {
        counters.billing++;
        if (billingUnavailable) throw new Error('billing mirror unreachable');
        return subscriptions;
      },
    },
  }, { RUNNER_OWNER_EMAIL: OWNER, ...env });
  return { load, counters };
}

const getAccess = (options) => {
  const h = harness(options);
  return h.load('lib/auth/access.ts').getRunnerAccess().then((access) => ({ access, counters: h.counters }));
};

test('exactly one owner address is accepted; a list or a malformed value yields no owner', () => {
  const { getOwnerConfigurationState, getOwnerEmail } = loader({}, {})('lib/auth/owner.ts');

  assert.equal(getOwnerConfigurationState({}), 'unset');
  assert.equal(getOwnerConfigurationState({ RUNNER_OWNER_EMAIL: '   ' }), 'unset');
  assert.equal(getOwnerConfigurationState({ RUNNER_OWNER_EMAIL: 'not-an-email' }), 'invalid');
  assert.equal(getOwnerConfigurationState({ RUNNER_OWNER_EMAIL: `${OWNER},second@runner.test` }), 'ambiguous');
  assert.equal(getOwnerConfigurationState({ RUNNER_OWNER_EMAIL: OWNER }), 'configured');

  // An unusable configuration must fail closed rather than pick a winner.
  assert.equal(getOwnerEmail({ RUNNER_OWNER_EMAIL: `${OWNER},second@runner.test` }), null);
  assert.equal(getOwnerEmail({ RUNNER_OWNER_EMAIL: OWNER }), OWNER);
});

test('owner matching is case and whitespace insensitive but admits no one else', () => {
  const { isOwnerEmail } = loader({}, {})('lib/auth/owner.ts');
  const env = { RUNNER_OWNER_EMAIL: OWNER };

  assert.equal(isOwnerEmail(OWNER, env), true);
  assert.equal(isOwnerEmail('  Owner@Runner.TEST  ', env), true);

  for (const impostor of ['someone@runner.test', 'owner@runner.test.evil.com', 'xowner@runner.test', '', null, undefined]) {
    assert.equal(isOwnerEmail(impostor, env), false);
  }
  assert.equal(isOwnerEmail(OWNER, {}), false);
  assert.equal(isOwnerEmail(OWNER, { RUNNER_OWNER_EMAIL: `${OWNER},second@runner.test` }), false);
});

test('the owner gets permanent full access without any subscription or grant lookup', async () => {
  const { access, counters } = await getAccess({ user: accountFixture(OWNER) });

  assert.equal(access.isOwner, true);
  assert.equal(access.role, 'owner');
  assert.equal(access.entitlement, 'owner');
  assert.equal(access.source, 'owner');
  assert.equal(access.fullAccess, true);
  assert.equal(access.isAdmin, true);
  assert.equal(access.expiresAt, null, 'owner access must never carry an expiry');
  assert.equal(access.paidPlan, null, 'owner access must not claim a paid plan it never bought');

  // Resolved before Stripe and before the grants table, so neither can revoke it.
  assert.equal(counters.billing, 0);
  assert.equal(counters.database, 0);
});

test('owner access survives a billing outage, a canceled subscription and an expired grant', async () => {
  for (const options of [
    { billingUnavailable: true },
    { subscriptions: [{ status: 'canceled', plan: 'pro', period_end: '2020-01-01T00:00:00Z' }] },
    { grants: [{ clerk_user_id: null, email: OWNER, active: false, expires_at: '2020-01-01T00:00:00Z' }] },
  ]) {
    const { access } = await getAccess({ user: accountFixture(OWNER), ...options });
    assert.equal(access.isOwner, true);
    assert.equal(access.fullAccess, true);
    assert.equal(access.expiresAt, null);
  }
});

test('the owner tier outranks admin metadata and any active subscription', async () => {
  const { access } = await getAccess({
    user: accountFixture(OWNER, { metadata: { role: 'admin' } }),
    subscriptions: [{ status: 'active', plan: 'plus', period_end: '2027-01-01T00:00:00Z' }],
  });
  assert.equal(access.entitlement, 'owner');
  assert.equal(access.expiresAt, null, 'a subscription period must not cap owner access');
});

test('an unverified address cannot claim ownership', async () => {
  const { access } = await getAccess({ user: accountFixture(OWNER, { verified: false }) });
  assert.equal(access.isOwner, false);
  assert.equal(access.fullAccess, false);
  assert.equal(access.entitlement, 'free');
});

test('the owner badge is exclusive: no other account, tier or admin carries it', async () => {
  const other = 'member@runner.test';

  const anonymous = await getAccess({ user: null });
  assert.equal(anonymous.access.isOwner, false);

  const free = await getAccess({ user: accountFixture(other) });
  assert.equal(free.access.isOwner, false);
  assert.equal(free.access.fullAccess, false);

  const subscriber = await getAccess({
    user: accountFixture(other),
    subscriptions: [{ status: 'active', plan: 'premium_plus', period_end: '2027-01-01T00:00:00Z' }],
  });
  assert.equal(subscriber.access.isOwner, false);
  assert.equal(subscriber.access.fullAccess, true, 'paid subscribers keep full access');

  const bootstrapAdmin = await getAccess({
    user: accountFixture(other),
    env: { RUNNER_ADMIN_BOOTSTRAP_EMAILS: other },
  });
  assert.equal(bootstrapAdmin.access.isAdmin, true);
  assert.equal(bootstrapAdmin.access.isOwner, false, 'an admin is not the owner');

  const comped = await getAccess({
    user: accountFixture(other),
    grants: [{ clerk_user_id: null, email: other, active: true, expires_at: null }],
  });
  assert.equal(comped.access.entitlement, 'manual_access');
  assert.equal(comped.access.isOwner, false);
});

test('no owner is configured means no account is the owner', async () => {
  for (const value of [undefined, '', `${OWNER},second@runner.test`]) {
    const { access } = await getAccess({ user: accountFixture(OWNER), env: { RUNNER_OWNER_EMAIL: value } });
    assert.equal(access.isOwner, false);
    assert.equal(access.entitlement, 'free');
  }
});
