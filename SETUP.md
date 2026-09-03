# Setup

## 1. Supabase

A Supabase project must be provisioned for this app. Keep its project reference,
organization, billing information, and credentials in the deployment environment—not in this public repository.

- Apply `supabase/migrations/0001_init.sql` (creates `games`, `props`, `market_movements`, `signals`,
  `tracked_bets`, all with row-level security enabled and no policies — meaning only the **service role** key can
  read/write them right now; the anon key has no access until this app grows client-side/user-scoped features).
- Apply `supabase/migrations/20260903043224_prediction_market_intelligence.sql` for prediction-market storage.

To get the service-role key (not retrievable via automation — grab it from the dashboard):

1. Open the project in the [Supabase dashboard](https://supabase.com/dashboard/projects).
2. Project Settings → API → copy the **service_role** key (under "Project API keys").
3. Also copy the **anon public** key from the same page (already fetched once, but rotates if you regenerate it).

If you'd rather use a different Supabase project, update `SUPABASE_URL`/keys below and re-run the migration's SQL
against that project (`supabase/migrations/0001_init.sql`) via the SQL editor or the Supabase CLI.

## 2. The Odds API

1. Sign up at [the-odds-api.com](https://the-odds-api.com/) and copy your API key from the dashboard.
2. Free tier is 500 credits/month; each call to `/v4/sports/{sport}/odds` costs roughly `1 credit × markets requested`.
   The sync job requests `h2h,spreads,totals` for 4 sports every 15 minutes, so budget accordingly — 4 sports × 3
   markets × 96 syncs/day ≈ 1,152 credits/day, which exceeds the free tier. Either raise `CRON_SECRET`-gated sync
   frequency in `vercel.json` (e.g. every 30–60 minutes) or upgrade your plan before going live.

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
ODDS_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
KALSHI_API_KEY_ID=
KALSHI_PRIVATE_KEY_BASE64=
KALSHI_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_RUNNER_PRO=
STRIPE_PRICE_RUNNER_COMMAND=
NEXT_PUBLIC_APP_URL=https://werunsportsandanalytics.com
```

Encode the downloaded Kalshi private-key file before placing it in a multiline-hostile environment-variable UI:

```bash
base64 < kalshi-private-key.key | tr -d '\n'
```

Use a Kalshi key with read scope only for this ingestion service. Polymarket's public Gamma market-data API does
not require account or wallet credentials for this release.

`lib/env.ts` throws a clear error naming any of the first four that's missing, at first use.

## 4. Running locally

```bash
npm install
npm run dev
```

Every page will render empty (games/markets/signals) until you trigger a sync at least once. The ESPN
enrichment sync runs separately and needs no API key:

```bash
curl -X POST http://localhost:3000/api/cron/sync-odds -H "Authorization: Bearer $CRON_SECRET"
curl -X POST http://localhost:3000/api/cron/sync-espn -H "Authorization: Bearer $CRON_SECRET"
# Narrow an ESPN run with query params, e.g.:
#   /api/cron/sync-espn?tiers=teams,scoreboard&sports=nba
```

## 5. Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add the same environment variables in Project Settings → Environment Variables (mark
   `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as sensitive).
3. `vercel.json` declares cron jobs for sportsbook odds every 15 minutes, prediction markets every
   10 minutes, and ESPN enrichment every 5 minutes (the ESPN route tiers work by freshness — teams
   daily, rosters every 6 hours, injuries hourly, standings every 30 minutes, scoreboards on every
   run) — Vercel automatically sends
   `Authorization: Bearer $CRON_SECRET` on cron-triggered requests once `CRON_SECRET` is set as an env var.
4. Confirm it under Project Settings → Cron Jobs after the first deploy.

## 6. Clerk, Stripe, and the Runner connector

1. In Clerk, allow the production domain and use `/sign-in` and `/sign-up` as the application paths.
2. In Stripe, create separate Products for Runner Pro and Runner Command, create recurring Prices,
   and place their `price_...` IDs in the matching environment variables above.
3. Register `https://werunsportsandanalytics.com/api/webhooks/stripe` in Stripe for
   `checkout.session.completed`, `customer.subscription.updated`, and
   `customer.subscription.deleted`; store the signing secret as `STRIPE_WEBHOOK_SECRET`.
4. Configure Stripe's Customer Portal before enabling the billing button. Do not enable automatic
   tax until a business tax registration has been added in Stripe Tax.
5. After deployment, connect `https://werunsportsandanalytics.com/mcp` in ChatGPT Developer Mode
   and rescan/refresh the connector whenever MCP tool metadata changes.

## Known limitations (don't silently paper over these)

- **Player props are not synced.** `lib/providers/oddsApi.ts` has `fetchEventPlayerProps`, but the cron job
  (`app/api/cron/sync-odds/route.ts`) does not call it yet — The Odds API requires a separate per-event call for
  prop markets, and the exact market keys available depend on your plan tier. `/props` will stay empty until this
  is wired up.
- **No bettor-consensus/handle data.** `signals.movement.consensus` is a literal `"N/A — ..."` string, not a
  fabricated percentage — The Odds API doesn't expose public betting percentages.
- **No independent player-performance projections.** `PlayerProp.projection`, `recentHitRate`, and `matchupContext`
  are `undefined` until a real projection/stats pipeline exists — they are not backfilled with guesses.
- **`Game.keyFactors` is always `[]`.** The old mock data's scouting-style bullet points aren't real analysis; no
  replacement source is connected yet.
- **Team abbreviations are derived until ESPN seeds the registry.** The Odds API only returns full team
  names; `deriveAbbreviation()` in `lib/providers/oddsApi.ts` generates a short code from initials. Once
  `/api/cron/sync-espn?tiers=teams` has populated `team_registry`, the odds sync resolves names through
  it (official ESPN abbreviations) and the derived code is only a fallback.
- **ESPN endpoints are unofficial and unstable.** They can change shape or rate-limit without notice, so
  `lib/providers/espnApi.ts` caches aggressively, times out fast, retries only transient failures, and
  every ingestion tier fails soft — an ESPN outage degrades enrichment (`espn_records` goes stale) but
  never blocks the market feed. ESPN odds are a cross-check reference only; The Odds API remains the
  market source of truth.
- **RSA EDGE MODEL v0.1 is an unbacktested heuristic** (no-vig consensus vs. one book's price), not a trained
  predictive model — see `lib/models/edgeCalculator.ts` for the exact math and documented weaknesses.
- **Responsible-gambling disclaimer copy is a placeholder** (`components/legal/ResponsibleGamblingNotice.tsx`) —
  get it reviewed by counsel for your state-specific requirements before public promotion.
- **Prediction-market execution is disabled.** The integration reads public Kalshi and Polymarket market data only.
  Kalshi credentials are reserved for a later authenticated realtime worker. Never expose private keys to client code.
- **Prediction markets are not automatically matched to sportsbook games yet.** The
  `prediction_market_game_mappings` table requires exact/manual verification before a cross-market edge is published;
  settlement wording can differ even when two titles appear to describe the same event.
