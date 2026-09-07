# Claude Code — Runner Sports Site

Follow `AGENTS.md` as the shared engineering contract.

## Mission
Continue the existing Runner Sports website implementation. Do not scaffold a replacement project. This repository is the production presentation/product layer connected to Runner Sports intelligence.

## Relationship to Runner Sports Demon
The sibling repository `FeeTheDeveloper/runner_sports_demon` owns live quantitative intelligence, models, signals, replay/backtesting, and local-first ingestion. This website should consume normalized/approved outputs rather than duplicating that engine.

## Environment
Use exact variable names declared in `.env.example`. Fee The Developer supplies real values through local `.env.local` and Vercel. Never print, commit, log, fixture, or document secret values.

## Website priorities
- reliable live sports presentation
- Runner intelligence dashboard
- team/player identity assets
- multi-sport navigation
- game/market/signal visualization
- Clerk authentication
- Stripe access tiers
- Supabase-backed normalized data
- safe server-only credentials
- responsive production UX

## Verification
Before claiming a change works, run the relevant build/lint/tests. If a provider or deployment cannot be verified because credentials or external permissions are missing, report the exact blocker without inventing success.
