# Dependency Register

Governing scope: [RUNNER_REPLACEMENT_DIRECTIVE.md](./RUNNER_REPLACEMENT_DIRECTIVE.md) · Created 2026-11-04

Status values: **OPEN** (decision/agreement needed) · **IN USE – UNVERIFIED** (running today, rights/fit not confirmed for the new scope) · **VERIFIED** · **REJECTED**.
No dependency is VERIFIED yet. A personal premium subscription is not evidence of commercial data rights.

## Data

| ID | Dependency | Feature IDs | Current state | Open questions | Status |
|---|---|---|---|---|---|
| DEP-DATA-01 | Sport coverage contract (which sports × which tools) | SPT-*, NAV-* | Odds sync: NFL, NCAAF, NBA, WNBA, MLB, NHL. ESPN: + NCAAB. None: UFC, golf, soccer, peripheral sections | Launch order (directive recommends one complete sport/market workflow first) | OPEN |
| DEP-DATA-02 | Odds provider (game, prop, futures) | ODD-001..005, VAL-*, CMB-* | The Odds API in use (`ODDS_API_KEY`); SETUP notes current cadence exceeds free-tier credits | Plan tier, prop/futures coverage, books covered, latency, **commercial display/redistribution rights**, historical depth | IN USE – UNVERIFIED |
| DEP-DATA-03 | Live scores/game state | ODD-007 | ESPN unofficial endpoints (no key) | Licensed live feed vs. unofficial; latency; display rights | IN USE – UNVERIFIED |
| DEP-DATA-04 | Player/team stats, game logs, splits | RSC-001..004, RSC-006 | Partial via ESPN rosters/standings; no game logs | Licensed stats provider; historical depth | OPEN |
| DEP-DATA-05 | Injury data | RSC-005 | ESPN unofficial | Rights; update timing | IN USE – UNVERIFIED |
| DEP-DATA-06 | Consensus / public-betting / sharp-money data | PCK-004, PCK-005 | None | Licensed source or Runner-community-only | OPEN |
| DEP-DATA-07 | Sportsbook parlay/SGP rule tables | CMB-001, CMB-003 | None | Source of book rules per jurisdiction | OPEN |
| DEP-DATA-08 | Historical results + closing lines | SYS-*, PRJ-003, PCK-002, TRK-003 | Demon has nflverse PBP ingestion script; no site history | Depth per sport; closing-line source | OPEN |
| DEP-DATA-09 | Prediction-market data (Kalshi, Polymarket) | PMK-001 | Public read APIs in use; Kalshi key reserved | Display terms | IN USE – UNVERIFIED |
| DEP-DATA-10 | BettingPros API (advertised REST JSON: odds, props, projections) | potential for ODD-*, PRJ-* | Not used | **Terms review + written agreement required before any evaluation in product**; licensed projections must be labeled third-party | OPEN |

## Models

| ID | Dependency | Feature IDs | Open questions | Status |
|---|---|---|---|---|
| DEP-MODEL-01 | Projection/model strategy: Runner-developed vs. licensed third-party | PRJ-*, PRP-003, PCK-007 | Ownership (Demon vs site), evaluation harness, origin labeling | OPEN |
| DEP-MODEL-02 | LLM provider for AI research interface | AI-001, AI-002 | Provider, grounding store, cost caps, eval suite | OPEN |

## Integrations

| ID | Dependency | Feature IDs | Current state | Status |
|---|---|---|---|---|
| DEP-INT-01 | Sportsbook account sync provider (consent + revocation) | TRK-001 | Juice Reel CSV manual import (admin only) | OPEN |
| DEP-INT-02 | Pick'em platform rules (PrizePicks, Underdog) + legal review | CMB-004, CMB-005 | None | OPEN |
| DEP-INT-03 | Clerk (auth) | MEM-*, all protected | In use | IN USE – UNVERIFIED for new entitlement map |
| DEP-INT-04 | Stripe (billing) | MEM-001..004 | In use (Runner Pro, Runner Command prices) | IN USE – UNVERIFIED |
| DEP-INT-05 | Supabase (data store) | all | In use; MCP unreachable this session | IN USE – UNVERIFIED |
| DEP-INT-06 | Vercel (hosting + cron) | all | In use | IN USE – UNVERIFIED |

## Commercial

| ID | Dependency | Open questions | Status |
|---|---|---|---|
| DEP-COMM-01 | Runner plan names, entitlements, prices, launch regions, platforms | Map Plus/Elite-equivalent tiers to feature IDs; jurisdictions | OPEN |
| DEP-COMM-02 | Responsible-gaming / jurisdiction compliance copy | Per launch region | OPEN |

## Environment variables

No new variables are introduced by this PR. Future dependencies will add names to `.env.example` (names only) when implemented.
