# Runner MCP Control Plane

## Current security boundary (2026-09-26)

The public MCP connector is now read-only. Remote command registration and
result lookup have been removed. Legacy control data functions reject every
request before touching Supabase, even when a bearer token is configured.
Secrets must never be supplied through model-visible tool arguments.

Re-enabling controls requires transport-bound identity, per-command capabilities,
tenant/resource scope, durable approvals for external effects, scoped result
access and atomic idempotency. FORCE_PUBLISH must never use a broad shared token.
No environment toggle currently re-enables remote controls.

## Historical design (superseded; do not enable)

The MCP route retains the existing read-only `search`, `fetch`,
`get_best_plays`, and `run_matchup_analysis` tools. It also exposes bounded
Runner read tools for status, live intelligence, signals, totals, pick health,
and research evidence.

Two control tools are intentionally narrow:

- `submit_runner_command`
- `get_runner_command_result`

`submit_runner_command` accepts only `refresh_live_intelligence`,
`refresh_provider_status`, or `rebuild_pick_health`. It writes a pending row to
`runner_control_commands`; it does not run a shell, URL, SQL statement, or
arbitrary executable. The Demon worker owns command execution and writes
`runner_control_results`.

The earlier shared-token design has been withdrawn. `RUNNER_MCP_BEARER_TOKEN`
remains a reserved compatibility variable and does not enable any control tool.
