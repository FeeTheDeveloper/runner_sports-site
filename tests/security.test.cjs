const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

// Execute the actual TS modules with controlled Clerk/DB/HTTP boundaries. No
// production credentials or live provider writes are used by this regression.
function loader(stubs) {
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
    vm.runInNewContext(code, { require: injectedRequire, module, exports: module.exports, process, Date, Response, URL, console }, { filename: file });
    return module.exports;
  }
  return load;
}

function trackerHarness() {
  let access = { authenticated: false, userId: null, fullAccess: false };
  let databaseCalls = 0;
  const rows = [
    { id: 'alice-bet', owner_user_id: 'alice', bet_date: '2026-09-26', sport: 'NFL', event: 'A vs B', selection: 'A', market: 'ML', sportsbook: 'book', odds: 100, stake: 20, result: 'win', profit: 20, closing_odds: null, clv: null },
    { id: 'bob-bet', owner_user_id: 'bob', bet_date: '2026-09-26', sport: 'NFL', event: 'A vs B', selection: 'B', market: 'ML', sportsbook: 'book', odds: 100, stake: 100, result: 'loss', profit: -100, closing_odds: null, clv: null },
    { id: 'legacy-bet', owner_user_id: null, bet_date: '2026-09-26', sport: 'NFL', event: 'A vs B', selection: 'A', market: 'ML', sportsbook: 'book', odds: 100, stake: 900, result: 'win', profit: 900, closing_odds: null, clv: null },
  ];
  const client = { from(table) {
    assert.equal(table, 'tracked_bets'); databaseCalls++;
    const filters = []; let insertion;
    const query = {
      select() { return query; },
      eq(key, value) { filters.push([key, value]); return query; },
      order() { return query; },
      insert(value) { insertion = { id: 'new-bet', ...value }; rows.push(insertion); return query; },
      single() { return Promise.resolve({ data: insertion, error: null }); },
      then(resolve, reject) { return Promise.resolve({ data: rows.filter(row => filters.every(([key, value]) => row[key] === value)), error: null }).then(resolve, reject); },
    };
    return query;
  } };
  const load = loader({
    '@/lib/auth/access': { getRunnerAccess: async () => access },
    '@/lib/supabase/server': { getSupabaseServerClient: () => client },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  });
  return { load, rows, setAccess(value) { access = value; }, get databaseCalls() { return databaseCalls; } };
}

test('tracker refuses anonymous and unentitled data access before database reads', async () => {
  const h = trackerHarness(); const tracker = h.load('lib/data/tracker.ts');
  for (const method of [tracker.getTrackedBets, tracker.getTrackerSummary, () => tracker.addTrackedBet({})]) {
    await assert.rejects(method, error => error.status === 401);
  }
  h.setAccess({ authenticated: true, userId: 'alice', fullAccess: false });
  await assert.rejects(tracker.getTrackedBets, error => error.status === 403);
  assert.equal(h.databaseCalls, 0);
});

test('tracker list and summaries isolate two users and exclude unowned legacy records', async () => {
  const h = trackerHarness(); const tracker = h.load('lib/data/tracker.ts');
  for (const [user, profit] of [['alice', 20], ['bob', -100]]) {
    h.setAccess({ authenticated: true, userId: user, fullAccess: true, isAdmin: true });
    assert.deepEqual(Array.from(await tracker.getTrackedBets(), row => row.id), [user + '-bet']);
    assert.equal((await tracker.getTrackerSummary()).totalProfit, profit);
  }
});

test('all tracker HTTP routes return 401/403; foreign record IDs return 404', async () => {
  const h = trackerHarness();
  const list = h.load('app/api/tracker/route.ts');
  const detail = h.load('app/api/tracker/[id]/route.ts');
  const summary = h.load('app/api/tracker/summary/route.ts');
  const request = () => ({ nextUrl: new URL('https://runner.test/api/tracker'), json: async () => ({}) });
  const calls = [() => list.GET(request()), () => list.POST(request()), () => detail.GET(request(), { params: Promise.resolve({ id: 'bob-bet' }) }), () => summary.GET()];
  for (const call of calls) assert.equal((await call()).status, 401);
  h.setAccess({ authenticated: true, userId: 'alice', fullAccess: false });
  for (const call of calls) assert.equal((await call()).status, 403);
  assert.equal(h.databaseCalls, 0);
  h.setAccess({ authenticated: true, userId: 'alice', fullAccess: true });
  assert.equal((await detail.GET(request(), { params: Promise.resolve({ id: 'bob-bet' }) })).status, 404);
  assert.equal((await detail.GET(request(), { params: Promise.resolve({ id: 'legacy-bet' }) })).status, 404);
});

test('tracker inserts bind the verified owner and reject invalid prices and dates', async () => {
  const h = trackerHarness(); h.setAccess({ authenticated: true, userId: 'alice', fullAccess: true });
  const route = h.load('app/api/tracker/route.ts');
  const body = { date: '2026-09-26', sport: 'NFL', event: 'A vs B', selection: 'A', market: 'ML', sportsbook: 'book', odds: 100, stake: 20, owner_user_id: 'bob' };
  const post = value => route.POST({ json: async () => value });
  assert.equal((await post(body)).status, 200);
  assert.equal(h.rows.at(-1).owner_user_id, 'alice');
  for (const change of [{ odds: 0 }, { odds: -90 }, { closingOdds: Infinity }, { date: '2026-02-30' }, { clv: NaN }]) {
    assert.equal((await post({ ...body, ...change })).status, 400);
  }
});

test('tracker masks provider error details and returns non-cacheable 503', async () => {
  const load = loader({
    '@/lib/auth/tracker': { requireTrackerOwner: async () => 'alice', TrackerAccessError: class extends Error {} },
    'next/server': { NextResponse: { json: (body, init) => Response.json(body, init) } },
  });
  const result = await load('lib/api/trackerResponse.ts').trackerResponse(async () => { throw new Error('private database detail'); });
  assert.equal(result.status, 503);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(await result.text(), /private database detail/);
});

test('legacy remote controls reject every command without touching a provider', async () => {
  const controls = loader({})('lib/data/runnerControls.ts');
  for (const command of controls.RUNNER_CONTROL_COMMANDS) {
    await assert.rejects(() => controls.submitRunnerControlCommand(command, {}, 'any-token', 'key'), /disabled/);
  }
  await assert.rejects(() => controls.getRunnerControlResult('id', 'any-token'), /disabled/);
});

test('public MCP registration exposes only annotated reads and no bearer input', () => {
  const registrations = [];
  const source = fs.readFileSync(path.join(root, 'app/mcp/route.ts'), 'utf8');
  const stubs = { 'mcp-handler': { createMcpHandler(register) { register({ registerTool: (...args) => registrations.push(args) }); return () => {}; } } };
  for (const match of source.matchAll(/from "(@\/lib\/data\/[^\"]+)"/g)) {
    stubs[match[1]] = new Proxy({}, { get: () => async () => { throw new Error('unexpected data call'); } });
  }
  loader(stubs)('app/mcp/route.ts');
  assert.ok(registrations.length > 10);
  for (const [name, definition] of registrations) {
    assert.equal(definition.annotations.readOnlyHint, true, name);
    assert.equal(definition.inputSchema.shape.bearerToken, undefined, name);
  }
  assert.ok(!registrations.some(([name]) => name === 'force_publish'));
});

test('email-based admin and manual grants require a verified primary address and preserve identity bindings', async () => {
  const previous = process.env.RUNNER_ADMIN_BOOTSTRAP_EMAILS;
  process.env.RUNNER_ADMIN_BOOTSTRAP_EMAILS = 'admin@example.test';
  let user = { id: 'alice', primaryEmailAddress: { emailAddress: 'admin@example.test', verification: { status: 'unverified' } }, privateMetadata: {} };
  let grants = [];
  const accessModule = loader({
    '@clerk/nextjs/server': { currentUser: async () => user },
    '@/lib/auth/config': { isClerkConfigured: () => true },
    '@/lib/supabase/server': { getSupabaseServerClient: () => ({ from() {
      const filters = [];
      const q = { select() { return q; }, eq(key, value) { filters.push([key, value]); return q; }, is(key, value) { return q.eq(key, value); }, then(resolve, reject) { return Promise.resolve({ data: grants.filter(row => filters.every(([key, value]) => row[key] === value)), error: null }).then(resolve, reject); } };
      return q;
    } }) },
  })('lib/auth/access.ts');
  try {
    assert.equal((await accessModule.getRunnerAccess()).isAdmin, false);
    user.primaryEmailAddress.verification.status = 'verified';
    assert.equal((await accessModule.getRunnerAccess()).isAdmin, true);
    user.primaryEmailAddress.emailAddress = 'member@example.test';
    grants = [{ clerk_user_id: 'bob', email: 'member@example.test', active: true, expires_at: null }];
    assert.equal((await accessModule.getRunnerAccess()).fullAccess, false);
    grants[0].clerk_user_id = null;
    assert.equal((await accessModule.getRunnerAccess()).fullAccess, true);
    user.primaryEmailAddress.verification.status = 'unverified';
    assert.equal((await accessModule.getRunnerAccess()).fullAccess, false);
    grants[0].clerk_user_id = 'alice';
    assert.equal((await accessModule.getRunnerAccess()).fullAccess, true);
  } finally {
    if (previous === undefined) delete process.env.RUNNER_ADMIN_BOOTSTRAP_EMAILS;
    else process.env.RUNNER_ADMIN_BOOTSTRAP_EMAILS = previous;
  }
});
