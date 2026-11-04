# Architecture and Data-Flow Decisions

Governing scope: [RUNNER_REPLACEMENT_DIRECTIVE.md](./RUNNER_REPLACEMENT_DIRECTIVE.md)

| ID | Decision | Status | Date |
|---|---|---|---|
| ADR-000 | Replace product scope in place inside `runner_sports-site`; no replacement project scaffold | ACCEPTED | 2026-11-04 |
| ADR-001 | Ownership of projections/models between Demon and site | PROPOSED | 2026-11-04 |
| ADR-002 | Route scheme `/{sport}/{tool}` | PROPOSED | 2026-11-04 |
| ADR-003 | Origin labeling on every estimate and pick | ACCEPTED | 2026-11-04 |
| ADR-004 | Feature-ID-based entitlement map | PROPOSED | 2026-11-04 |
| ADR-005 | Immutable publication snapshots | PROPOSED | 2026-11-04 |

## ADR-000 — Replace in place
The existing Next.js 15 / Clerk / Stripe / Supabase / Vercel stack already serves odds ingestion, auth, billing, and
tracking. The directive allows reuse after verification. Every reused module must be mapped to a feature ID in the
[feature register](./FEATURE_REGISTER.md) and verified against that feature's acceptance criteria before it counts as built.

## ADR-001 — Model ownership (proposed)
Current: Demon owns models and publishes into `runner_*`; site computes market-derived no-vig EV
(`lib/models/edgeCalculator.ts`). Proposal: keep **market-derived calculations** (no-vig, EV, best price, payouts) as
deterministic site libraries with fixtures; keep **predictive models** (projections, fair lines) in the Demon behind a
versioned publish contract (`contracts/model-output.schema.json` as the starting point). Blocked on DEP-MODEL-01.

## ADR-002 — Route scheme (proposed)
Sport hubs at `/{sport}` with tools at `/{sport}/{tool}` (odds, props, projections, picks, research, systems) plus
sport-agnostic tools (`/tools/*`, `/tracker`, `/account`). Legacy flat routes redirect. Decide before building NAV-003.

## ADR-003 — Origin labels (accepted)
Every estimate, rating, or pick carries `origin ∈ {runner_model, market_derived, editorial, expert, community, licensed_third_party}`,
plus `source`, `as_of`, and (for models) `model_version`. Licensed third-party output is never labeled Runner model output.
Market-derived EV (RSA EDGE v0.1) is `market_derived`.

## ADR-004 — Entitlements (proposed)
Replace the binary `fullAccess` in `lib/auth/access.ts` with a server-side map `feature_id → minimum tier`, enforced in
both pages and `/api/*` routes (closes SEC-02). Tier names wait on DEP-COMM-01.

## ADR-005 — Publication snapshots (proposed)
Published picks/sheets/systems write an immutable snapshot row (market, price, book, publication time, origin, model
version, inputs hash). Corrections create a new row referencing the original; nothing is updated in place.

## Current data flow (as inventoried)

```text
The Odds API ──cron sync-odds──▶ games / market_movements / signals (RSA EDGE v0.1)
ESPN (unofficial) ──cron sync-espn──▶ espn_records / team_registry
Kalshi, Polymarket ──cron sync-prediction-markets──▶ prediction_markets*
runner_sports_demon ──publish──▶ runner_* tables ──▶ /api/runner/*, /mcp
Juice Reel CSV ──admin import──▶ runner_bets / runner_bet_legs ──▶ /performance
Supabase (service role, server-only) ──▶ lib/data/* ──▶ App Router pages (Clerk + paywall)
```
