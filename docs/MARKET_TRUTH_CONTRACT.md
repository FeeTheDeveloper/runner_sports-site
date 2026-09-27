# Market presentation contract

Updated 2026-09-26. These changes harden existing market research surfaces; they do not establish predictive-model or production readiness.

## Probability and risk

- Edge, game and prop probabilities produced by the Site are no-vig sportsbook consensus calculations. No independent model runs in these mappers.
- API outputs now identify `probabilityBasis: no_vig_market_consensus` and `independentModelProbability: null`. Edge/game consumers should read `noVigConsensusProbability`. `modelProbability` is null until an independent validated model is connected. Missing game prices yield null consensus and implied probabilities, `marketDataStatus: unavailable` and an empty projected winner. UI consumers show unavailable states without converting null to zero or 50%.
- Legacy `confidence` values describe the count of books, not prediction calibration. Updated research cards display book depth. Edge `riskLevel` is `unassessed`; adding more books does not establish low betting risk.
- A positive consensus-minus-implied probability gap excludes fees, limits, execution and independent outcome information. `executablePriceVerified` is false.

## Quote eligibility

- Source quote timestamps, rather than row-update timestamps, determine eligibility. Quotes older than 20 minutes, more than one minute in the future, missing timestamps, nonfinite prices and invalid American prices are excluded.
- The 20-minute window supports the existing 15-minute polling cadence. This is delayed research, not a live execution guarantee.
- Prop probabilities use the deepest exact-line group and count each book once. Duplicate quotes retain the newest observation. Edge comparisons require at least two distinct books.
- Missing prop prices produce no row, not a fabricated line or probability. Missing current game prices withhold directional claims on the updated game surfaces.
- Main-market timestamp ingestion uses the oldest constituent timestamp. Refreshing derivative markets cannot refresh the stored moneyline timestamp. Existing database snapshots predate this safeguard and require an ordinary authorized provider refresh before freshness acceptance.
- Prop `source.retrievedAt` retains retrieval semantics; `quoteCapturedAt` records the oldest contributing quote timestamp. Edge `updatedAt` similarly reports the oldest contributing quote rather than database-write time.

## Systems and remaining work

The Systems page now presents an explicit engine-unavailable state with no invented performance records or live qualifiers. A versioned engine, tested backtests and receipt lineage remain required before real systems can publish.

The homepage and Sunday layouts are preserved, with synthetic pick/game/prop fallbacks removed. These surfaces and the dashboard read the explicit consensus field, display book coverage and show unavailable states when genuine data is absent. External API consumers must handle nullable model and missing-market fields.

## Verification

`node --test tests/market-truth.test.cjs` exercises freshness boundaries, invalid input, exact-line isolation, distinct-book depth, missing-data suppression, explicit probability/risk metadata, withheld game direction and derivative timestamp isolation. Fixtures are synthetic and require no provider access. Full build and lint are recorded by the parent production audit after all concurrent local edits settle.
