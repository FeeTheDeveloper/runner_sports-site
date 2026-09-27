const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');
const moduleUnderTest = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', 'lib/data/runner.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
vm.runInNewContext(code, {
  module: moduleUnderTest, exports: moduleUnderTest.exports, Date,
  require(name) {
    if (name === 'server-only') return {};
    if (name === '@/lib/supabase/server') return { getSupabaseServerClient() { throw new Error('Freshness tests cannot access a provider'); } };
    throw new Error('Unexpected dependency: ' + name);
  },
});
const { freshnessFor, freshnessSummary } = moduleUnderTest.exports;
const now = Date.parse('2026-09-26T13:00:00Z');
const minutesAgo = minutes => new Date(now - minutes * 60000).toISOString();

test('saved fresh and live labels expire according to the actual receipt clock', () => {
  for (const freshness of ['fresh', 'live']) {
    assert.equal(freshnessFor({ freshness, as_of: minutesAgo(5) }, 15, now), 'FRESH');
    assert.equal(freshnessFor({ freshness, as_of: minutesAgo(20) }, 15, now), 'DELAYED');
    assert.equal(freshnessFor({ freshness, as_of: minutesAgo(31) }, 15, now), 'STALE');
  }
});

test('provider delayed, stale and offline claims remain minimum severity', () => {
  for (const freshness of ['delayed', 'stale', 'offline']) {
    assert.equal(freshnessFor({ freshness, as_of: minutesAgo(1) }, 15, now), freshness.toUpperCase());
  }
  assert.equal(freshnessFor({ freshness: 'delayed', as_of: minutesAgo(60) }, 15, now), 'STALE');
  assert.equal(freshnessFor({ freshness: 'offline', as_of: minutesAgo(60) }, 15, now), 'OFFLINE');
});

test('missing, invalid and future authoritative timestamps are unavailable', () => {
  for (const as_of of [undefined, '', 'invalid', '2026-02-30T00:00:00Z', '2026', '2999-01-01T00:00:00Z', '2026-09-26T12:00:00', '2026-09-26 12:00:00', '2026-09-25T24:00:00Z']) {
    assert.equal(freshnessFor({ freshness: 'fresh', as_of }, 15, now), 'OFFLINE');
  }
  assert.equal(freshnessFor({ freshness: 'delayed', as_of: 'invalid' }, 15, now), 'OFFLINE');
});

test('as_of takes precedence over a newer storage update, including invalid as_of', () => {
  assert.equal(freshnessFor({ as_of: minutesAgo(60), updated_at: minutesAgo(1) }, 15, now), 'STALE');
  assert.equal(freshnessFor({ as_of: 'invalid', updated_at: minutesAgo(1) }, 15, now), 'OFFLINE');
  assert.equal(freshnessFor({ as_of: '2999-01-01T00:00:00Z', updated_at: minutesAgo(1) }, 15, now), 'OFFLINE');
  assert.equal(freshnessFor({ as_of: null, updated_at: minutesAgo(1) }, 15, now), 'FRESH');
});

test('summary normalizes time zones and excludes invalid or future timestamps', () => {
  const summary = freshnessSummary([
    { as_of: '2026-09-26T15:00:00+03:00' },
    { as_of: '2026-09-26T12:30:00Z' },
    { as_of: '2999-01-01T00:00:00Z' },
    { as_of: 'invalid', updated_at: minutesAgo(1) },
  ], 15, now);
  assert.equal(summary.asOf, '2026-09-26T12:30:00.000Z');
  assert.equal(summary.state, 'OFFLINE', 'unavailable rows must not disappear behind a healthy aggregate');
  assert.equal(freshnessSummary([], 15, now).state, 'OFFLINE');
  assert.equal(freshnessSummary([{ as_of: 'invalid' }], 15, now).asOf, null);
  assert.equal(freshnessSummary([{ as_of: minutesAgo(1) }, { freshness: 'stale', as_of: minutesAgo(2) }], 15, now).state, 'STALE');
});
