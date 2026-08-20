# Setup

## 1. Supabase

A project has already been provisioned for this app:

- Project ref: `ntkicqxydbiqbbkzotbp`
- URL: `https://ntkicqxydbiqbbkzotbp.supabase.co`
- Org: "Runner Gang Lifestyle" (billed ~$10/month for this project)
- Migration applied: `supabase/migrations/0001_init.sql` (creates `games`, `props`, `market_movements`, `signals`,
  `tracked_bets`, all with row-level security enabled and no policies — meaning only the **service role** key can
  read/write them right now; the anon key has no access until this app grows client-side/user-scoped features).

To get the service-role key (not retrievable via automation — grab it from the dashboard):

1. Open the project at [supabase.com/dashboard/project/ntkicqxydbiqbbkzotbp](https://supabase.com/dashboard/project/ntkicqxydbiqbbkzotbp).
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
SUPABASE_URL=https://ntkicqxydbiqbbkzotbp.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

`lib/env.ts` throws a clear error naming any of the first four that's missing, at first use.

## 4. Running locally

```bash
npm install
npm run dev
```

Every page will render empty (games/markets/signals) until you trigger a sync at least once:

```bash
curl -X POST http://localhost:3000/api/cron/sync-odds -H "Authorization: Bearer $CRON_SECRET"
```

## 5. Deploying to Vercel

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add the same environment variables in Project Settings → Environment Variables (mark
   `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as sensitive).
3. `vercel.json` already declares a cron hitting `/api/cron/sync-odds` every 15 minutes — Vercel automatically sends
   `Authorization: Bearer $CRON_SECRET` on cron-triggered requests once `CRON_SECRET` is set as an env var.
4. Confirm it under Project Settings → Cron Jobs after the first deploy.

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
- **Team abbreviations are derived, not official.** The Odds API only returns full team names; `deriveAbbreviation()`
  in `lib/providers/oddsApi.ts` generates a short code from initials, which will sometimes disagree with a league's
  actual abbreviation (e.g. "NYK" vs. a derived "NYK" only by coincidence).
- **RSA EDGE MODEL v0.1 is an unbacktested heuristic** (no-vig consensus vs. one book's price), not a trained
  predictive model — see `lib/models/edgeCalculator.ts` for the exact math and documented weaknesses.
- **Responsible-gambling disclaimer copy is a placeholder** (`components/legal/ResponsibleGamblingNotice.tsx`) —
  get it reviewed by counsel for your state-specific requirements before public promotion.
