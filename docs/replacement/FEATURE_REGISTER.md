# Feature Register — Benchmark Parity

Data file: [`FEATURE_REGISTER.csv`](./FEATURE_REGISTER.csv) (one row per feature/subfeature; edit the CSV, it is the source of truth).
Governing scope: [RUNNER_REPLACEMENT_DIRECTIVE.md](./RUNNER_REPLACEMENT_DIRECTIVE.md) · Register v0.1 · 2026-11-04

## What this version is

An **initial** register seeded from the directive's observed benchmark catalog (observation date 2026-11-03) and a
read of the current Runner codebase. It is **not** an exhaustive certification: no authenticated, interactive, or
mobile observation of the benchmark has been performed yet, so most behavior columns read
`unknown - not yet observed`. Unknowns are intentionally kept visible.

## Columns

`feature_id, workstream, feature, sport_scope, platform, reference_url, observation_date, evidence_status, entry_points,
user_goal, inputs_defaults_filters, columns_sorting_charts, actions_exports, desktop_mobile_behavior, persistence,
account_requirement, subscription_restriction, states_loading_empty_unavailable_stale_error_denied, data_sources,
update_timing, market_definitions, settlement_rules, proposed_runner_behavior, original_design, dependencies,
acceptance_criteria, current_runner_asset, implementation_status, reviewer, verification_evidence, unresolved_differences`

Evidence status vocabulary: `observed public` · `observed authenticated` · `advertised only` · `inferred` · `unknown`.
Implementation status vocabulary: `not started` · `partial - legacy` (a pre-directive asset exists but is unverified
against the requirement) · `built` · `verified` · `deployed`. **Nothing is marked built/verified/deployed.** A route
existing is never sufficient.

## Summary (v0.1)

| Measure | Count |
|---|---|
| Rows | 93 |
| Sport/section hubs (SPT-001..016) | 16 |
| Evidence: advertised only / inferred / unknown / observed public | 48 / 35 / 8 / 2 |
| Implementation: not started / partial (legacy asset) | 52 / 41 |
| Built / verified / deployed | 0 / 0 / 0 |

| Prefix | Workstream |
|---|---|
| SPT, NAV, DQ | Discovery and navigation (DQ = directive discovery questions) |
| ODD, PMK | Games and odds |
| RSC | Player research |
| PRP, PRJ, VAL | Projections and value |
| PCK | Picks and consensus |
| CMB, CAL | Combination tools (incl. calculators) |
| SYS | Systems research |
| TRK | Tracking |
| AI | AI research interface |
| MEM | Membership |
| EDC, MED, BRK | Editorial and community |
| API | Developer platform |
| OPS | Operations |

## Next discovery passes (to raise evidence status)

1. Public interactive observation per tool page (desktop + 390px mobile): columns, filters, defaults, states.
2. Authenticated observation (requires owner-provided Plus/Elite access) — record as `observed authenticated`; do not
   infer concealed formulas.
3. Per-sport availability matrix for each tool (fills `sport_scope` per SPT row).
4. Calculator catalog enumeration (CAL-004).
