# Runner Sports Site

A Next.js 15 / TypeScript sports analytics and tracking platform.

## Structure

```
app/              # Route and composition layer (App Router)
  dashboard/      # Dashboard overview
  games/          # Live and scheduled games
  props/          # Player props marketplace
  edge/           # Edge analytics
  tracker/        # Bet tracker
  models/         # Predictive models
components/       # Reusable UI components
  navigation/     # Site navigation
  dashboard/      # Dashboard widgets
  sports/         # Sports-specific components
  ui/             # Generic UI primitives
lib/              # Data access, models, and utilities
  data/           # Async data fetching
  models/         # Domain model logic
  utils/          # Pure utility functions
types/            # Shared TypeScript contracts
public/           # Static assets
```

## Product surfaces

| Route | Purpose |
|---|---|
| `/picks` | Personalized Runner edge board |
| `/odds` | Cross-market odds comparison |
| `/games/:id` | Full matchup intelligence center |
| `/props` | Player prop research |
| `/research` | Team, player, trend, and injury research |
| `/systems` | Historical system discovery workspace |
| `/teams` | Canonical team registry and profiles |
| `/players` | Player intelligence search |
| `/models` | Runner model registry |
| `/prediction-markets` | Read-only Kalshi and Polymarket board |
| `/sign-up` and `/sign-in` | Clerk-hosted account entry paths |
| `/account` and `/billing` | Protected identity and Stripe billing paths |
| `/pricing` | Public Runner access levels and Stripe Checkout entry |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API

All endpoints return JSON as `{ data, meta? }`; missing resources return a structured `404` error.

| Endpoint | Filters |
|---------|---------|
| `GET /api/health` | None (reports Clerk configuration state only, no key material) |
| `GET /api/sports` | None |
| `GET /api/sports/:id` | None |
| `GET /api/games` | `sport`, `league`, `status`, `limit`, `offset` |
| `GET /api/games/:id` | Includes the game's props |
| `GET /api/props` | `sport`, `market`, `confidence`, `gameId`, `minEdge`, `limit`, `offset` |
| `GET /api/props/:id` | None |
| `GET /api/edges` | `sport`, `confidence`, `risk`, `minEdge`, `limit`, `offset` |
| `GET /api/edges/:id` | None |
| `GET /api/models` | `sport`, `status`, `limit`, `offset` |
| `GET /api/models/:id` | None |
| `GET /api/markets` | `direction`, `sportsbook`, `limit`, `offset` |
| `GET /api/markets/:id` | None |
| `GET /api/prediction-markets` | `provider`, `status`, `limit` |
| `GET /api/signals` | `market`, `direction`, `limit`, `offset` |
| `GET /api/signals/:id` | None |
| `GET /api/runner/status` | None |
| `GET /api/runner/live` | `sport`, `event`/`eventId`, `limit`, `maxAgeMinutes` |
| `GET /api/runner/signals` | `sport`, `event`/`eventId`, `limit`, `maxAgeMinutes` |
| `GET /api/runner/game-flow` | `sport`, `event`/`eventId`, `limit`, `maxAgeMinutes` |
| `GET /api/runner/totals` | `sport`, `event`/`eventId`, `limit`, `maxAgeMinutes` |
| `GET /api/runner/pick-health` | `sport`, `event`/`eventId`, `limit`, `maxAgeMinutes` |
| `GET /api/tracker` | `sport`, `result`, `limit`, `offset` |
| `POST /api/tracker` | Body: `{ date, sport, event, selection, market, sportsbook, odds, stake, result?, closingOdds?, clv? }` |
| `GET /api/tracker/:id` | None |
| `GET /api/tracker/summary` | None |
| `GET`/`POST /api/cron/sync-odds` | Requires `Authorization: Bearer $CRON_SECRET`. Pulls NFL, NCAAF, NBA, WNBA, MLB, and NHL odds from The Odds API and upserts `games`/`market_movements`/`signals` in Supabase. |
| `GET`/`POST /api/cron/sync-prediction-markets` | Requires `Authorization: Bearer $CRON_SECRET`. Pulls read-only sports markets from Kalshi and Polymarket and stores current state plus snapshots. |
| `GET`/`POST /api/cron/sync-espn` | Requires the cron bearer token. Pulls ESPN scoreboards, injuries, rosters, standings, and team facts into `espn_records`, and seeds the `team_registry` canonical identity. |
| `GET /api/espn/records` | `sport`, `league`, `dataType`, `entityId`, `limit`, `offset` |
| `POST /api/checkout` | Authenticated Stripe Checkout Session creation by Runner plan key |
| `POST /api/billing/portal` | Authenticated Stripe Customer Portal session creation |
| `GET /api/billing/status` | Authenticated subscription tier, access period, research access and explicit unavailable model/usage status |
| `POST /api/webhooks/stripe` | Signature-verified subscription lifecycle webhook |
| `GET`/`POST /mcp` | Read-only Streamable HTTP MCP connector for Runner search, market consensus research, matchup analysis, and bounded published intelligence |

## Runner MCP connector

The intended connector URL after verified deployment is `https://werunsportsandanalytics.com/mcp`. The local implementation is a tool-only
MCP server with standard `search` and `fetch` tools, matchup/edge analysis, bounded published
intelligence reads. Remote command tools are disabled pending scoped authentication and approval receipts. It exposes
analytics and source timestamps; it cannot place wagers or execute arbitrary commands.

Validate locally with MCP Inspector against `http://localhost:3000/mcp`, then add the production
HTTPS URL as a custom app/connector in ChatGPT Developer Mode after deployment.

Tracker API and data access require a verified Clerk identity with an active
Runner entitlement. All tracker queries bind that identity as the owner, including
dashboard/analytics consumers. Apply the ownership migration before rollout; see
[the security release gates](docs/SECURITY_RELEASE_GATES_2026-09-26.md).

`lib/data/*.ts` read from the approved Supabase project. The implemented ingestion paths are the `sync-odds`, `sync-espn`, and
`sync-prediction-markets` cron jobs plus the Demon `runner_*` published-intelligence
contract — see
[SETUP.md](./SETUP.md) for required environment variables, provisioning, and known limitations.

## Environment variables

See `.env.example` and [SETUP.md](./SETUP.md).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tracker, authorization, MCP and market-truth regression tests |

Billing setup and rollout requirements are documented in
[the connection contract](docs/BILLING_CONNECTION_CONTRACT.md). New subscriptions
remain disabled until provider bindings, approved terms and sandbox acceptance
are complete. The suite also tests billing routes, real PostgreSQL event/checkout
transactions, operations authorization, provider freshness and fan skins.

Pull requests and pushes to `main`/`release/runner-production` run install,
tests, lint, a production build and production dependency audit in
`.github/workflows/quality.yml`. Provider secrets are not required by these
offline gates. Live provider acceptance remains a separate release step.

See [the connected-launch handoff](docs/RUNNER_CONNECTED_LAUNCH_2026-09-26.md)
for current provider mismatches, the proposed commercial terms, team skins,
AI representative requirements and exact release gates. `/admin/operations`
is the protected owner workspace; it distinguishes configuration from verified
runtime receipts and does not imply an installed monitoring worker.
