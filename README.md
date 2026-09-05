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
| `GET /api/health` | None |
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
| `POST /api/webhooks/stripe` | Signature-verified subscription lifecycle webhook |
| `GET`/`POST /mcp` | Streamable HTTP MCP connector for Runner search, plays, and matchup analysis |

## Runner MCP connector

The production connector URL is `https://werunsportsandanalytics.com/mcp`. It is a read-only,
tool-only MCP server with standard `search` and `fetch` tools plus `get_best_plays` and
`run_matchup_analysis`. It exposes analytics and source timestamps; it cannot place wagers.

Validate locally with MCP Inspector against `http://localhost:3000/mcp`, then add the production
HTTPS URL as a custom app/connector in ChatGPT Developer Mode after deployment.

`lib/data/*.ts` read from Supabase, which is populated by the `sync-odds`, `sync-espn`, and
`sync-prediction-markets` cron jobs — see
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

## Related documentation

This repo is the product/presentation layer; `runner_sports_demon` is the primary
intelligence engine. See that repo's `PROJECT_HANDOFF.md` for the full architecture
and role assignment, and `CLAUDE_CREW_RESEARCH_PROTOCOL.md` for the live/pregame/
halftime research packet formats that feed the `/research` and `/prediction-markets`
surfaces here.
