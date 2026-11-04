# Runner Replacement Program

Active product scope for `runner_sports-site` as of 2026-11-04.

| Record | Purpose |
|---|---|
| [RUNNER_REPLACEMENT_DIRECTIVE.md](./RUNNER_REPLACEMENT_DIRECTIVE.md) | Owner directive (governing) |
| [SUPERSESSION_MAP.md](./SUPERSESSION_MAP.md) | Every legacy intelligence surface and its disposition |
| [FEATURE_REGISTER.md](./FEATURE_REGISTER.md) / [CSV](./FEATURE_REGISTER.csv) | Benchmark parity register |
| [DEPENDENCY_REGISTER.md](./DEPENDENCY_REGISTER.md) | Data, model, integration, commercial dependencies |
| [MIGRATION_MANIFEST.md](./MIGRATION_MANIFEST.md) | Snapshot, preservation, cutover and rollback plan |
| [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) | ADRs and current data flow |

Archived legacy policy lives in [`../archive/legacy-intelligence/`](../archive/legacy-intelligence/) and is **not** an
active instruction source.

## Program status

| Stage | State |
|---|---|
| Planned | Directive, supersession map, feature register v0.1, dependency register, migration manifest, ADRs committed |
| Built | `/systems` fabricated system records removed (data-honesty fix). SEC-01 per-user tracker ownership (PR #28). Runner plugin 0.2.0 on the directive (`runner_sports_demon` PR #29). No replacement product features built yet. |
| Verified | None |
| Deployed | None |

## Open security findings
SEC-01 (unauthenticated `/api/tracker` read/write — fix in PR #28) and SEC-02 (premium read APIs not entitlement-gated) — see
[SUPERSESSION_MAP.md §D](./SUPERSESSION_MAP.md#d-security-findings-surfaced-during-inventory).
