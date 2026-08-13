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

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
