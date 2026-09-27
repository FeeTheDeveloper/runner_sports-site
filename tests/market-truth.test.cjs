const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Transpile production modules in memory; provider reads are deterministic
// fixtures. No database connection or credentials are required.
function load(relative, overrides = {}) {
  const file = path.join(__dirname, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const result = { exports: {} };
  const resolve = (id) => {
    if (id in overrides) return overrides[id];
    if (id.startsWith("@/")) return load(id.slice(2) + ".ts", overrides);
    return require(id);
  };
  new Function("require", "module", "exports", "fetch", compiled)(resolve, result, result.exports, overrides.__fetch ?? globalThis.fetch);
  return result.exports;
}
const { comparablePropQuotes, isFreshQuote, MAX_QUOTE_AGE_MS } = load("lib/models/marketQuotes.ts");
const now = Date.now();
const stamp = new Date(now).toISOString();
const quote = (sportsbook, line, overrides = {}) => ({ sportsbook, line, overOdds: -110, underOdds: -110, capturedAt: stamp, ...overrides });

test("freshness rejects missing, invalid, stale and future source timestamps", () => {
  for (const value of [undefined, "", "invalid", new Date(now - MAX_QUOTE_AGE_MS - 1).toISOString(), new Date(now + 61_000).toISOString()]) {
    assert.equal(isFreshQuote(value, now), false);
  }
  assert.equal(isFreshQuote(new Date(now - MAX_QUOTE_AGE_MS).toISOString(), now), true);
});

test("prop consensus never mixes thresholds or counts one book twice", () => {
  const selected = comparablePropQuotes([quote("A", 20.5), quote("B", 20.5), quote("A", 20.5), quote("C", 21.5), quote("D", 20.5, { overOdds: 0 }), quote("E", 20.5, { underOdds: NaN })], now);
  assert.equal(selected.length, 2);
  assert.ok(selected.every((item) => item.line === 20.5));
  assert.deepEqual(comparablePropQuotes([quote("A", 1, { capturedAt: "bad" })], now), []);
});

function dataModules(gameRows, propRows) {
  const client = { from(table) {
    const response = { data: table === "games" ? gameRows : propRows, error: null };
    const builder = { then(resolve) { return Promise.resolve(response).then(resolve); } };
    for (const key of ["select", "order", "limit", "eq", "or", "ilike"]) builder[key] = () => builder;
    return builder;
  } };
  const overrides = {
    "@/lib/supabase/server": { getSupabaseServerClient: () => client },
    "@/lib/data/teamRegistry": { resolveTeamSearchNames: async (term) => [term] },
  };
  return { edges: load("lib/data/edges.ts", overrides), props: load("lib/data/props.ts", overrides) };
}

test("edge output suppresses stale sources and explicitly disclaims independent models and executable prices", async () => {
  const row = { id: "g", sport_id: "nfl", league: "NFL", home_team: { name: "Home" }, away_team: { name: "Away" }, updated_at: stamp, book_odds: [
    { sportsbook: "A", capturedAt: stamp, moneyline: { home: 150, away: -170 } },
    { sportsbook: "B", capturedAt: stamp, moneyline: { home: -200, away: 170 } },
  ] };
  const fresh = await dataModules([row], []).edges.getEdges();
  assert.ok(fresh.length);
  assert.equal(fresh[0].probabilityBasis, "no_vig_market_consensus");
  assert.equal(fresh[0].independentModelProbability, null);
  assert.equal(fresh[0].modelProbability, null);
  assert.equal(typeof fresh[0].noVigConsensusProbability, "number");
  assert.equal(fresh[0].riskLevel, "unassessed");
  assert.equal(fresh[0].executablePriceVerified, false);
  row.book_odds.forEach((q) => q.capturedAt = new Date(now - MAX_QUOTE_AGE_MS - 1000).toISOString());
  assert.deepEqual(await dataModules([row], []).edges.getEdges(), []);
});

test("missing prop prices do not produce fabricated zero lines or 50% probabilities", async () => {
  const row = { id: "p", game_id: "g", player: { name: "Player", team: "Home" }, opponent: "Away", sport: "NFL", market: "receptions", source: { retrievedAt: stamp }, book_odds: [] };
  assert.deepEqual(await dataModules([], [row]).props.getProps(), []);
  row.book_odds = [quote("A", 4.5), quote("B", 4.5), quote("C", 5.5, { overOdds: 1000 })];
  const [prop] = await dataModules([], [row]).props.getProps();
  assert.equal(prop.line, 4.5);
  assert.equal(prop.probability, 0.5);
  assert.equal(prop.bookCount, 2);
  assert.equal(prop.independentModelProbability, null);
});

test("game display withholds a winner and current consensus when prices are missing", () => {
  const { mapRowToGame } = load("lib/data/games.ts", {
    "@/lib/supabase/server": {},
    "@/lib/data/teamRegistry": {},
  });
  const game = mapRowToGame({ id: "g", sport_id: "nfl", league: "NFL", home_team: { id: "h" }, away_team: { id: "a" }, starts_at: stamp, status: "scheduled", book_odds: [], key_factors: [], source: {} });
  assert.equal(game.marketDataStatus, "unavailable");
  assert.equal(game.runnerProjectedWinner, "");
  assert.equal(game.noVigConsensusProbability, null);
  assert.equal(game.independentModelProbability, null);
  assert.equal(game.modelProbability, null);
  assert.equal(game.marketImpliedProbability, null);
});

test("missing model values render unavailable, never zero or 50 percent", () => {
  const { formatPercent } = load("lib/utils/format.ts");
  assert.equal(formatPercent(null), "Unavailable");
  assert.equal(formatPercent(undefined), "Unavailable");
  assert.equal(formatPercent(0), "0.0%");
});

test("a derivative refresh cannot refresh the timestamp of an older moneyline", () => {
  const { mergeEventMarkets } = load("lib/providers/oddsApi.ts", { "server-only": {} });
  const old = new Date(now - MAX_QUOTE_AGE_MS - 1000).toISOString();
  const game = { bookOdds: [{ sportsbookKey: "a", capturedAt: old, moneyline: { home: -110, away: -110 } }] };
  const result = mergeEventMarkets(game, [{ sportsbookKey: "a", capturedAt: stamp, markets: [{ marketKey: "totals_h1", capturedAt: stamp, outcomes: [] }] }]);
  assert.equal(result.bookOdds[0].capturedAt, old);
  assert.equal(result.bookOdds[0].markets[0].capturedAt, stamp);
});

test("provider ingestion rejects mismatched over-under thresholds before storage", async () => {
  const outcomes = [
    { name: "Over", description: "Player", point: 4.5, price: -110 },
    { name: "Under", description: "Player", point: 5.5, price: -110 },
  ];
  const { fetchEventPlayerProps } = load("lib/providers/oddsApi.ts", {
    "server-only": {},
    __fetch: async () => ({ ok: true, json: async () => ({ id: "g", sport_title: "NFL", bookmakers: [{ title: "A", last_update: stamp, markets: [{ key: "player_receptions", outcomes }] }] }) }),
  });
  assert.deepEqual(await fetchEventPlayerProps("nfl", "g", ["player_receptions"], "synthetic-fixture"), []);
  outcomes[1].point = 4.5;
  const [prop] = await fetchEventPlayerProps("nfl", "g", ["player_receptions"], "synthetic-fixture");
  assert.equal(prop.bookOdds[0].line, 4.5);
});
