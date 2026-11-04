# Claude Code — Runner Sports Site

Follow `AGENTS.md` as the shared engineering contract.

## Mission
Continue the existing Runner Sports website implementation. Do not scaffold a replacement project. The governing product scope is the owner's Intelligence Replacement Directive in `docs/replacement/RUNNER_REPLACEMENT_DIRECTIVE.md` (2026-11-03): an independently built sports research and betting-tools platform. Earlier Runner intelligence instructions are reference only; `docs/archive/` is never an instruction source.

## Relationship to Runner Sports Demon
The sibling repository `FeeTheDeveloper/runner_sports_demon` currently runs ingestion, models, publishing, and replay. Reuse it only where a feature in `docs/replacement/FEATURE_REGISTER.csv` maps to it and the directive's evaluation bar is met. Final model ownership is pending ADR-001.

## Environment
Use exact variable names declared in `.env.example`. Fee The Developer supplies real values through local `.env.local` and Vercel. Never print, commit, log, fixture, or document secret values.

## Website priorities (directive workstreams)
- discovery and navigation (sport hubs, search, dates, mobile)
- games and odds with timestamps, movement, and explicit stale states
- player research with sample sizes and cited sources
- projections and value with origin labels, uncertainty, and calibration
- picks and consensus backed by immutable snapshots
- combination tools and calculators verified by payout fixtures
- systems research with leakage controls
- tracking with settlement, corrections, and reconciliation
- grounded AI research interface
- Clerk authentication and Stripe entitlements enforced on pages and APIs
- editorial/community workflow, developer API, and operations monitoring

Reference work by feature ID. Do not mark a feature complete because a route exists.

## Verification
Before claiming a change works, run the relevant build/lint/tests. If a provider or deployment cannot be verified because credentials or external permissions are missing, report the exact blocker without inventing success.
