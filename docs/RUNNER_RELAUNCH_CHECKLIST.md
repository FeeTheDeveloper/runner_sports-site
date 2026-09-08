# Runner Relaunch Checklist

- [ ] Apply `20260907193000_runner_published_intelligence.sql`.
- [ ] Confirm RLS is enabled on every `runner_*` table.
- [ ] Confirm the Demon service can publish intelligence and claim control
  commands with its server-side credentials.
- [ ] Set `RUNNER_MCP_BEARER_TOKEN` only in `.env.local`/Vercel.
- [ ] Verify `/api/runner/status` reports engine/provider freshness.
- [ ] Verify live, signals, totals, game-flow, and pick-health routes with
  `sport` and `eventId` filters.
- [ ] Validate MCP read tools with an MCP inspector.
- [ ] Validate an allowlisted command queues a pending row and that an
  arbitrary command is rejected.
- [ ] Confirm source timestamps and stale/unknown states are visible in the
  client experience.
- [ ] Run `npm run build` and `npm run lint`.
- [ ] Do not deploy until provider permissions and production credentials are
  confirmed.
