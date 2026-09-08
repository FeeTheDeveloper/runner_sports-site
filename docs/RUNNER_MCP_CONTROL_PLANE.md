# Runner MCP Control Plane

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

Set the server-only `RUNNER_MCP_BEARER_TOKEN` in `.env.local` or Vercel to
enable control tools. The token is supplied to the control tool input by the
trusted MCP caller and is checked server-side; it is never included in
`.env.example` with a value or sent to browser code. Missing/invalid tokens are
rejected.
