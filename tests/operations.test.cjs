const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function load(file, stubs, env = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  vm.runInNewContext(code, {
    module, exports: module.exports, process: { env }, Date, URL,
    require(name) {
      if (Object.hasOwn(stubs, name)) return stubs[name];
      if (name === 'server-only') return {};
      return require(name);
    },
  }, { filename: file });
  return module.exports;
}

const runnerEnv = () => ({
  SUPABASE_URL: 'https://vrhvvywncclonfwplsjl.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-private-database-key',
  SUPABASE_EXPECTED_PROJECT_REF: 'vrhvvywncclonfwplsjl',
  CLERK_SECRET_KEY: 'synthetic-private-identity-key',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'synthetic-public-key',
  STRIPE_SECRET_KEY: 'synthetic-private-payment-key',
  RUNNER_DEMON_API_URL: 'http://private-engine.invalid:8787/private',
});

const { validRunnerTimestamp } = load('lib/data/runner.ts', {
  '@/lib/supabase/server': { getSupabaseServerClient() { throw new Error('Timestamp validation must not access providers'); } },
});

function service(access, query, env = runnerEnv()) {
  return load('lib/operations/status.ts', {
    '@/lib/auth/access': { getRunnerAccess: async () => access },
    '@/lib/auth/config': { getClerkConfigurationState: () => 'unverified_instance' },
    '@/lib/env': { getSupabaseEnv: () => ({}) },
    '@/lib/stripe/server': { isStripeBillingConfigured: () => /^acct_[A-Za-z0-9]+$/.test(env.STRIPE_EXPECTED_ACCOUNT_ID ?? '') && ['test', 'live'].includes(env.STRIPE_BILLING_MODE) },
    '@/lib/data/runner': { queryRunnerTable: query, validRunnerTimestamp },
  }, env);
}

test('operations denies anonymous and non-admin callers before reading configuration or providers', async () => {
  let reads = 0;
  const env = new Proxy({}, { get() { throw new Error('configuration must not be read'); } });
  for (const [access, status] of [[{ authenticated: false, isAdmin: false }, 401], [{ authenticated: true, isAdmin: false }, 403]]) {
    const module = service(access, async () => { reads++; return []; }, env);
    await assert.rejects(module.getAdminOperations, error => error.status === status);
  }
  assert.equal(reads, 0);
});

test('operations rejects unexpected database targets without accessing them', async () => {
  for (const url of ['https://wrong-project.supabase.co', 'https://vrhvvywncclonfwplsjl.supabase.co.attacker.invalid', 'https://name:secret@vrhvvywncclonfwplsjl.supabase.co', 'not-a-url']) {
    let reads = 0;
    const module = service({ authenticated: true, isAdmin: true }, async () => { reads++; return []; }, { ...runnerEnv(), SUPABASE_URL: url });
    const snapshot = await module.getAdminOperations();
    assert.equal(snapshot.engine.state, 'target_mismatch');
    assert.equal(snapshot.providers.state, 'target_mismatch');
    assert.equal(reads, 0);
    assert.ok(!JSON.stringify(snapshot).includes(url));
  }
});

test('operations emits only allowlisted receipt fields and configuration booleans', async () => {
  const now = new Date().toISOString();
  const env = runnerEnv();
  const module = service({ authenticated: true, isAdmin: true }, async table => table === 'runner_engine_status'
    ? [{ id: 'runner-sports-demon', heartbeat_at: now, status: 'running', payload: { secret: 'synthetic-row-secret' }, error_summary: 'private-server-error' }]
    : [{ provider: 'kalshi', last_success_at: now, status: 'CONNECTED', latest_error: 'private-provider-error', metadata: { apiKey: 'private-provider-key' } }], env);
  const snapshot = await module.getAdminOperations();
  assert.equal(snapshot.engine.state, 'available');
  assert.equal(snapshot.engine.items[0].freshness, 'RECENT');
  assert.equal(snapshot.providers.items[0].name, 'Kalshi');
  const output = JSON.stringify(snapshot);
  for (const secret of [env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, env.CLERK_SECRET_KEY, env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, env.STRIPE_SECRET_KEY, env.RUNNER_DEMON_API_URL, 'synthetic-row-secret', 'private-server-error', 'private-provider-error', 'private-provider-key']) {
    assert.ok(!output.includes(secret), 'raw configuration or provider payload must not be serialized');
  }
  assert.equal(snapshot.connections.find(entry => entry.id === 'identity').configured, false, 'key presence cannot override an unverified identity binding');
  assert.equal(snapshot.connections.find(entry => entry.id === 'identity').requirements[0].present, true);
  assert.equal(snapshot.connections.find(entry => entry.id === 'billing').configured, false);
});

test('operations includes explicit project and merchant bindings and rejects mismatched configuration', async () => {
  const env = { ...runnerEnv(), SUPABASE_EXPECTED_PROJECT_REF: 'aaaaaaaaaaaaaaaaaaaa', STRIPE_SECRET_KEY: 'sk_test_synthetic', STRIPE_WEBHOOK_SECRET: 'synthetic-signing', STRIPE_PRICE_RUNNER_PRO: 'price_fixture1', STRIPE_PRICE_RUNNER_COMMAND: 'price_fixture2', STRIPE_EXPECTED_ACCOUNT_ID: 'acct_fixture', STRIPE_BILLING_MODE: 'live' };
  let reads = 0;
  const module = service({ authenticated: true, isAdmin: true }, async () => { reads++; return []; }, env);
  const snapshot = await module.getAdminOperations();
  assert.equal(snapshot.connections.find(entry => entry.id === 'database').configured, false);
  assert.equal(snapshot.connections.find(entry => entry.id === 'billing').configured, false);
  assert.equal(snapshot.engine.state, 'target_mismatch');
  assert.equal(reads, 0);
  assert.ok(snapshot.connections.find(entry => entry.id === 'billing').requirements.some(check => check.label === 'Merchant binding' && check.present));
  assert.ok(snapshot.connections.find(entry => entry.id === 'billing').requirements.some(check => check.label === 'Billing mode' && check.present));
});

test('stored freshness claims cannot hide stale, missing, or future timestamps', async () => {
  const module = service({ authenticated: true, isAdmin: true }, async table => table === 'runner_engine_status' ? [] : [
    { provider: 'espn', freshness: 'fresh', last_success_at: '2020-01-01T00:00:00Z', status: 'CONNECTED' },
    { provider: 'odds_api', freshness: 'live', last_success_at: '2999-01-01T00:00:00Z' },
    { provider: 'polymarket', freshness: 'fresh', as_of: new Date().toISOString(), latest_error: 'secret' },
  ]);
  const snapshot = await module.getAdminOperations();
  assert.equal(snapshot.engine.state, 'empty');
  assert.deepEqual(Array.from(snapshot.providers.items, row => row.freshness), ['STALE', 'UNVERIFIED', 'UNVERIFIED']);
});

test('receipt queries preserve partial results and mask provider failures', async () => {
  const module = service({ authenticated: true, isAdmin: true }, async table => {
    if (table === 'runner_engine_status') throw new Error('private-provider-failure');
    return [{ provider: 'kalshi', last_success_at: new Date().toISOString() }];
  });
  const snapshot = await module.getAdminOperations();
  assert.equal(snapshot.engine.state, 'unavailable');
  assert.equal(snapshot.providers.state, 'available');
  assert.ok(!JSON.stringify(snapshot).includes('private-provider-failure'));
});

test('operations rejects impossible calendar dates and timestamps without a timezone', async () => {
  for (const timestamp of ['2026-02-30T12:00:00Z', '2026-09-26T12:00:00', '2026-09-26 12:00:00']) {
    const module = service({ authenticated: true, isAdmin: true }, async table => table === 'runner_engine_status'
      ? [{ id: 'runner-sports-demon', heartbeat_at: timestamp, status: 'running' }]
      : [{ provider: 'espn', last_success_at: timestamp, status: 'CONNECTED' }]);
    const snapshot = await module.getAdminOperations();
    for (const section of [snapshot.engine, snapshot.providers]) {
      assert.equal(section.items[0].freshness, 'UNVERIFIED');
      assert.equal(section.items[0].receivedAt, null);
    }
  }
});

test('operations page redirects denied callers before rendering protected content', async () => {
  for (const [status, destination] of [[401, '/sign-in'], [403, '/account']]) {
    class OperationsAccessError extends Error { constructor(status) { super(); this.status = status; } }
    const page = load('app/admin/operations/page.tsx', {
      'next/link': () => null,
      'next/navigation': { redirect(url) { throw new Error('redirect:' + url); } },
      '@/components/ui/ProductHeading': () => null,
      '@/components/ui/SectionHeader': () => null,
      '@/components/ui/Badge': () => null,
      '@/lib/operations/status': { OperationsAccessError, getAdminOperations: async () => { throw new OperationsAccessError(status); } },
    });
    await assert.rejects(page.default, error => error.message === 'redirect:' + destination);
  }
});
