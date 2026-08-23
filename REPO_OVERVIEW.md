# Runner Sports & Analytics — Repository Overview

Next.js 15 (App Router) / TypeScript sports-intelligence and bet-tracking site. This document describes the
repository as it stands after the go-live pass: real odds data via The Odds API, persisted in Supabase, computed
into no-vig market-edge signals, with a live bet tracker. It replaces the earlier all-mock-data version.

## 1. What the app does

Runner Sports & Analytics shows, for NFL/NBA/MLB/NHL:

- **Games** — upcoming/live games with a no-vig consensus win probability computed across every sportsbook quoting
  the moneyline.
- **Player Props** — per-prop no-vig consensus probability vs. a displayed book's price (currently empty — see
  §6, prop ingestion isn't wired up yet).
- **Edges** — a ranked board of the biggest gaps between the no-vig consensus and one book's own price, across
  both game moneylines and props.
- **Markets** — opening-vs-current line movement per sportsbook, tracked across sync cycles.
- **Signals** — derived line-movement + model-vs-market deltas for game totals.
- **Tracker** — a personal, real (Supabase-backed) wager log with win/loss/ROI/CLV summary stats, writable via
  `POST /api/tracker`.
- **Analytics** — performance breakdowns (by sport, cumulative units, closing-line value) computed from the
  tracker's actual logged bets.
- **Models** — a small static registry documenting the methodology version(s) in use (see §4).

Explicitly **not** in this pass: user accounts/login, a paywall/subscription gate, or placing real bets. This is a
research/analytics site, not a sportsbook — see the disclaimer in §7.

## 2. Architecture at a glance

```
The Odds API  ──(cron, every 15 min)──▶  app/api/cron/sync-odds  ──▶  Supabase (games, market_movements, signals)
                                                                             │
                                                        lib/data/*.ts  ◀─────┘  (reads + no-vig computation)
                                                              │
                                                     app/api/**/route.ts  (thin JSON wrappers)
                                                              │
                                                        app/**/page.tsx  (Server Components, direct data calls)

User ──POST /api/tracker──▶ lib/data/tracker.ts ──▶ Supabase tracked_bets
```

Pages call `lib/data/*.ts` functions directly (no client-side fetch to the app's own API); the `/api/*` routes
exist as a separate public JSON contract for external consumers, backed by the same `lib/data` functions.

## 3. Directory structure

```
app/
  page.tsx                 Public marketing/landing page (bypasses the app shell/sidebar)
  layout.tsx               Root layout: metadata, viewport, wraps everything in AppShell
  error.tsx / not-found.tsx / loading.tsx   App Router special files (error boundary, 404, skeleton)
  manifest.ts / robots.ts  PWA manifest and robots.txt, generated via Next's metadata file conventions
  dashboard/page.tsx        Executive overview: top games, props, edges, signals, tracker summary
  games/page.tsx             Full games slate, grouped by league
  props/page.tsx + PropsExplorer.tsx     Player prop board (client-side filter/explore component)
  edge/page.tsx + EdgeBoard.tsx          Ranked edge board (client-side component)
  markets/page.tsx           Line-movement board
  tracker/page.tsx           Bet log + summary stats
  analytics/page.tsx         Derived performance analytics from tracked bets
  models/page.tsx            Model registry / methodology documentation page
  api/                       JSON API routes — see §5
    cron/sync-odds/route.ts  Odds-sync job (see §5.2)
    {sports,games,props,edges,markets,signals,models,tracker}/route.ts (+ [id]/route.ts)

components/
  navigation/    AppShell (layout shell), Header, Sidebar, MobileNav, AgentNavigator, nav-items.ts
  ui/            Generic primitives: Badge, ConfidenceBadge, DataStatusBadge, EmptyState, ProbabilityBar,
                 SectionHeader, SportsTable, TrendIndicator
  sports/        GameCard, PropCard, EdgeCard
  markets/       MarketMovementCard
  charts/        PerformanceChart (inline SVG line chart, no charting library)
  dashboard/     StatCard
  brand/         RunnerLogo
  legal/         ResponsibleGamblingNotice (see §7)

lib/
  env.ts                   Validates required env vars at first use (throws with a clear message if missing)
  api/response.ts          Shared route helpers: ok(), notFound(), badRequest(), filterValue(), paginate()
  data/                     Data-access layer — one file per domain object, see §4
    games.ts, props.ts, markets.ts, signals.ts, edges.ts, tracker.ts, models.ts, sports.ts
  models/edgeCalculator.ts RSA EDGE MODEL v0.1 — the no-vig consensus math (see §4)
  providers/oddsApi.ts     The Odds API client + response mapping
  supabase/
    server.ts              Service-role Supabase client (server-only, typed against database.types.ts)
    database.types.ts       Generated TypeScript types matching the live schema (regenerate after migrations)
  utils/format.ts           Formatting helpers (odds, percent, currency, date)

types/index.ts              Shared domain types (Game, PlayerProp, RunnerEdge, TrackedBet, RunnerModel, etc.)
supabase/migrations/0001_init.sql   Schema: games, props, market_movements, signals, tracked_bets
public/brand/                Static logo asset
vercel.json                  Cron schedule for the sync-odds job
.env.example, SETUP.md       Environment variables and setup instructions
README.md                    Quick-start + API table
```

## 4. Data layer and the edge methodology

### 4.1 Where data comes from

| Table              | Populated by                                   | Read by                          |
|---------------------|------------------------------------------------|-----------------------------------|
| `games`              | `sync-odds` cron (The Odds API: h2h/spreads/totals) | `lib/data/games.ts`, `edges.ts` |
| `props`              | **Not yet populated** — see §6                 | `lib/data/props.ts`, `edges.ts`  |
| `market_movements`   | `sync-odds` cron (opening/current line + price per book) | `lib/data/markets.ts`     |
| `signals`            | `sync-odds` cron (derived from `market_movements` + no-vig consensus) | `lib/data/signals.ts` |
| `tracked_bets`        | User-submitted via `POST /api/tracker`         | `lib/data/tracker.ts`            |

Per-sportsbook prices are stored as JSONB arrays (`book_odds` on `games`/`props`) rather than one row per book, so
the app layer can compute a consensus at read time without a second write path.

### 4.2 RSA EDGE MODEL v0.1 (`lib/models/edgeCalculator.ts`)

The core heuristic: compute a **no-vig consensus probability** across every sportsbook quoting a market, then
compare it to one specific book's own (vig-included) implied probability. The gap is the "edge."

- `americanToImpliedProbability(odds)` — standard American-odds-to-probability conversion.
- `devigTwoWay(oddsA, oddsB)` — removes the vig from a two-sided market by normalizing both sides' raw implied
  probabilities to sum to 1.
- `computeConsensusProbability(probs[])` — mean of each book's devigged probability for one side.
- `computeEdge(modelProbability, marketImpliedProbability)` — the two above, subtracted.
- `classifyConfidence(bookCount)` — `high` (≥5 books), `moderate` (≥3), else `low`.

**This is explicitly documented as an unbacktested baseline heuristic, not a trained predictive model.** The
`models.ts` registry reports `accuracy`/`calibration`/`sampleSize` as `0` rather than fabricating performance
numbers — those populate once a real backtest against settled results exists.

### 4.3 What's intentionally left blank rather than faked

Per the project's "don't fabricate data" rule, several fields that the old mock data populated with plausible-looking
numbers are now `undefined`/empty until a real source exists:

- `PlayerProp.projection`, `.recentHitRate`, `.matchupContext` — no independent stats/projection model is connected.
- `Game.keyFactors` — always `[]`; no scouting/analysis pipeline exists.
- `MarketSignal.movement.consensus` — literally the string `"N/A — no bettor consensus/handle data source connected"`,
  not a fabricated betting-public percentage (The Odds API doesn't expose this).
- Team abbreviations are algorithmically derived from initials (`deriveAbbreviation()` in `oddsApi.ts`), not the
  league's official codes, since The Odds API only returns full team names.

## 5. API

All endpoints return `{ data, meta? }` on success or `{ error: { code, message } }` on failure.

| Endpoint | Filters / Body |
|---|---|
| `GET /api/health` | — |
| `GET /api/sports`, `GET /api/sports/:id` | — |
| `GET /api/games` | `sport`, `league`, `status`, `limit`, `offset` |
| `GET /api/games/:id` | Includes the game's props |
| `GET /api/props` | `sport`, `market`, `confidence`, `gameId`, `minEdge`, `limit`, `offset` |
| `GET /api/props/:id` | — |
| `GET /api/edges` | `sport`, `confidence`, `risk`, `minEdge`, `limit`, `offset` |
| `GET /api/edges/:id` | — |
| `GET /api/models`, `GET /api/models/:id` | `sport`, `status` |
| `GET /api/markets`, `GET /api/markets/:id` | `direction`, `sportsbook` |
| `GET /api/signals`, `GET /api/signals/:id` | `market`, `direction` |
| `GET /api/tracker` | `sport`, `result`, `limit`, `offset` |
| `POST /api/tracker` | `{ date, sport, event, selection, market, sportsbook, odds, stake, result?, closingOdds?, clv? }` — validates required fields, computes `profit` from `odds`/`stake`/`result` |
| `GET /api/tracker/:id`, `GET /api/tracker/summary` | — |
| `GET`/`POST /api/cron/sync-odds` | Requires `Authorization: Bearer $CRON_SECRET`. Vercel Cron calls this via `GET` automatically; `POST` is for manual triggering. |

Caching: most `GET` routes declare `export const revalidate = 60` (data refreshes every 15 min via cron, so a
minute of staleness is fine); tracker routes and the cron route use `revalidate = 0` since they must reflect writes
immediately.

### 5.1 `lib/api/response.ts`

Shared helpers: `ok(data, meta?)`, `notFound(resource, id)`, `badRequest(message)`, `filterValue()` (case-insensitive
optional-filter match), `paginate(items, searchParams)` (clamps `limit` to 1–100, defaults 50/0).

### 5.2 The sync-odds cron job

`app/api/cron/sync-odds/route.ts`, on a 15-minute Vercel Cron schedule (`vercel.json`):

1. For each of NFL/NBA/MLB/NHL, calls The Odds API for `h2h,spreads,totals` odds.
2. Upserts each game into `games` (full row replace each sync — no "opening" concept for games themselves).
3. Upserts `market_movements` per (game, market, sportsbook), **preserving `opening_line`/`opening_price`** across
   syncs by omitting those columns from the `ON CONFLICT` update — only `current_line`/`current_price`/`direction`
   change on subsequent syncs.
4. Derives `signals` for game totals: consensus fair probability of "Over" across all books this sync, compared to
   each individual book's own price (same methodology as §4.2, applied cross-sectionally within one sync rather
   than across time).

Auth: requires `Authorization: Bearer $CRON_SECRET`; Vercel automatically attaches this header on cron-triggered
requests once `CRON_SECRET` is set as a project env var.

## 6. Database schema (`supabase/migrations/0001_init.sql`)

| Table | Key columns | Notes |
|---|---|---|
| `games` | `id` (PK, Odds API event id), `sport_id`, `league`, `home_team`/`away_team` (jsonb), `starts_at`, `status`, `book_odds` (jsonb array), `key_factors` (text[]), `source` (jsonb) | |
| `props` | `id` (PK), `game_id` (FK → games, cascade delete), `player` (jsonb), `book_odds` (jsonb array) | Table exists, currently always empty — see below |
| `market_movements` | `id` (PK, deterministic `gameId:market:sportsbook` slug), `opening_line`/`opening_price` vs `current_line`/`current_price`, `direction` | Opening values are write-once per row |
| `signals` | `id` (PK), `movement` (jsonb), `model_market_delta`, `note` | |
| `tracked_bets` | `id` (PK, `uuid`, server-generated), `bet_date`, `result` (win/loss/push/pending), `profit`, `closing_odds`, `clv` | Only table with real user-generated writes |

All five tables have **row-level security enabled with no policies defined** — only the Supabase service-role key
(server-side only, never shipped to the client) can read or write them. This is intentional for a no-login pass;
revisit before adding any client-side Supabase access.

**Known gap:** player-prop odds ingestion isn't wired into the cron job. `lib/providers/oddsApi.ts` has
`fetchEventPlayerProps()` ready to call The Odds API's per-event props endpoint, but the exact market keys
(`player_points`, etc.) vary by sport and by Odds API plan tier, so it's left for deliberate configuration rather
than guessed. Until that's wired up, `/props` and the props side of `/edge` stay empty.

## 7. Compliance / legal

`components/legal/ResponsibleGamblingNotice.tsx` renders on the public landing page footer and on every internal
page (via `AppShell`). Copy avoids "guaranteed"/"lock"-style language, states the site is informational-only, not
a sportsbook, and includes a 1-800-GAMBLER reference. It's marked `TODO(legal)` — get final copy reviewed by
counsel for state-specific requirements before public promotion.

## 8. Environment & setup

Required env vars (validated by `lib/env.ts`, throws naming any that are missing):

- `ODDS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET` (checked separately, only inside the cron route)

A Supabase project is already provisioned (ref `ntkicqxydbiqbbkzotbp`, ~$10/month, org "Runner Gang Lifestyle")
with the migration above applied. Full setup, credit-budget math for The Odds API's free tier against the 15-minute
sync schedule, and deployment steps are in **SETUP.md**.

## 9. Known limitations (not silently glossed over)

- Player props are not synced (see §6).
- No bettor-consensus/handle (public betting %) data source is connected.
- No independent player-performance projection model — `projection`/`recentHitRate`/`matchupContext` stay empty.
- `Game.keyFactors` is always empty — no scouting/analysis pipeline.
- Team abbreviations are algorithmically derived, not official league codes.
- RSA EDGE MODEL v0.1 is an unbacktested heuristic, not a validated predictive model.
- `npm install` currently reports a critical vulnerability in `next@15.4.6` (CVE-2025-66478) — not yet addressed,
  since a Next.js version bump is its own testing surface.
- Responsible-gambling disclaimer copy is a placeholder pending legal review.

## 10. Stack

Next.js 15.4.6 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4 · `@supabase/supabase-js` · The Odds API ·
Supabase (Postgres) · deployed to Vercel (cron via `vercel.json`).
