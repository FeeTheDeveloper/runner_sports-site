# Runner Data Ownership

> **Reference only — superseded as product policy.** Governing scope is [docs/replacement/RUNNER_REPLACEMENT_DIRECTIVE.md](./replacement/RUNNER_REPLACEMENT_DIRECTIVE.md) (2026-11-03). This file still describes running infrastructure; see [SUPERSESSION_MAP.md](./replacement/SUPERSESSION_MAP.md).

| Area | Owner | Site responsibility |
|---|---|---|
| Ingestion and provider adapters | `runner_sports_demon` | Consume published, normalized output |
| Forecasts, signals, totals, game flow | Demon/model pipeline | Present source timestamps and freshness |
| Pick health | Demon validation/health pipeline | Display healthy, watch, stale, or blocked |
| Research evidence | Demon research bridge | Preserve source URL/name and retrieval time |
| Authenticated control commands | Site MCP control plane | Persist an allowlisted request only |
| Command execution and results | Demon worker | Claim, execute, and write result records |
| Customer UI, API, Clerk, Stripe | `runner_sports-site` | Enforce presentation and access rules |

The site must not duplicate the Demon database, model engine, private local
files, provider credentials, or arbitrary process execution. Google Drive is a
research/report bridge, not the live website database.
