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
| `GET /api/signals` | `market`, `direction`, `limit`, `offset` |
| `GET /api/signals/:id` | None |
| `GET /api/tracker` | `sport`, `result`, `limit`, `offset` |
| `GET /api/tracker/:id` | None |
| `GET /api/tracker/summary` | None |

The current data providers are explicitly simulated. Replace the functions in `lib/data` with a live odds/data provider or database without changing these public API contracts.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
