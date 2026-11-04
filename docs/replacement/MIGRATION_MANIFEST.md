# Migration Manifest

Governing scope: [RUNNER_REPLACEMENT_DIRECTIVE.md](./RUNNER_REPLACEMENT_DIRECTIVE.md) · Created 2026-11-04

**Status: PLANNED.** No data has been migrated, moved, or deleted. Row counts are **not yet captured** — the
Supabase MCP connection failed in this session and no database credentials are available. The directive does
not authorize erasing records; default disposition for legacy content is archive.

## 1. Snapshot procedure (before any cutover step)

1. Supabase dashboard → Database → Backups: confirm a PITR/daily backup exists and record its timestamp.
2. Take a logical dump of the schema + data for every table below (`supabase db dump` for schema and `--data-only`
   for data), stored outside the repo in the owner-controlled backup location. Never commit dumps.
3. Run the count queries in §3 and record results in §2 with the snapshot timestamp.
4. Restore the dump into a Supabase branch and re-run §3; counts must match (restoration rehearsal).

## 2. Store inventory (source: `supabase/migrations/*`)

| Table / view | Class | Disposition | Count @ snapshot |
|---|---|---|---|
| `tracked_bets` | User transactions | PRESERVE-RECORDS → migrate to per-user tracker (TRK-002) after owner column added | not captured |
| `runner_import_runs`, `runner_bets`, `runner_bet_legs` (+ views `runner_bet_performance`, `runner_portfolio_summary`, `runner_market_type_performance`) | Tracked transactions + provenance | PRESERVE-RECORDS | not captured |
| `manual_access_grants` | Account/entitlement | PRESERVE-RECORDS | not captured |
| `veteran_discount_requests` | Billing/eligibility (sensitive) | PRESERVE-RECORDS | not captured |
| Stripe customers/subscriptions (in Stripe, keyed by Clerk metadata) | Billing | PRESERVE-RECORDS (external) | not captured |
| Clerk users | Accounts | PRESERVE-RECORDS (external) | not captured |
| `signals` | Legacy derived output (RSA EDGE v0.1) | Historical picks/provenance → PRESERVE-RECORDS (read-only archive); producer DISABLE-AT-CUTOVER | not captured |
| `runner_published_intelligence`, `runner_forecasts`, `runner_pick_health`, `runner_game_flow`, `runner_signals`, `runner_totals`, `runner_totals_windows` | Legacy Demon intelligence outputs | Freeze (read-only) at cutover; retain as provenance | not captured |
| `runner_engine_status`, `runner_provider_status` | Ops telemetry | RETAIN-MAPPED (OPS-001/002) | not captured |
| `runner_research_evidence` | Source provenance | PRESERVE-RECORDS | not captured |
| `runner_control_commands`, `runner_control_results` | Ops audit | PRESERVE-RECORDS | not captured |
| `games`, `props`, `market_movements` | Provider-derived market data | RETAIN-MAPPED (ODD-*) | not captured |
| `prediction_markets`, `prediction_market_snapshots`, `prediction_market_game_mappings` | Provider-derived | RETAIN-MAPPED (PMK-001) | not captured |
| `team_registry`, `espn_records` | Reference/provider-derived | RETAIN-MAPPED (RSC-*) | not captured |
| Embeddings / vector stores | — | None found in migrations; external stores not inventoried | n/a |

## 3. Count queries (run against the snapshot and the restore)

```sql
select 'tracked_bets' t, count(*) from tracked_bets
union all select 'runner_bets', count(*) from runner_bets
union all select 'runner_bet_legs', count(*) from runner_bet_legs
union all select 'runner_import_runs', count(*) from runner_import_runs
union all select 'manual_access_grants', count(*) from manual_access_grants
union all select 'veteran_discount_requests', count(*) from veteran_discount_requests
union all select 'signals', count(*) from signals
union all select 'runner_forecasts', count(*) from runner_forecasts
union all select 'runner_signals', count(*) from runner_signals
union all select 'runner_research_evidence', count(*) from runner_research_evidence
union all select 'runner_control_commands', count(*) from runner_control_commands
union all select 'games', count(*) from games
union all select 'market_movements', count(*) from market_movements;
```

## 4. Cutover steps (each gated; none executed)

| Step | Action | Rollback |
|---|---|---|
| C1 | Snapshot + restore rehearsal (§1) | n/a |
| C2 | Ship replacement producer behind a feature flag | Disable flag |
| C3 | Stop `signals` writes in `sync-odds` (keep odds ingestion) | Re-enable write path (single commit revert) |
| C4 | Stop Demon `push-runner-intel` / `publishing` for superseded `runner_*` outputs | Restart publisher |
| C5 | Revoke write grants on frozen legacy tables (read-only) | Re-grant |
| C6 | Reconcile counts vs §2; sign-off by King Fee | Restore from C1 snapshot |

Destructive DB changes (drops, revokes in production) require King Fee's explicit approval per the operating approval matrix.
