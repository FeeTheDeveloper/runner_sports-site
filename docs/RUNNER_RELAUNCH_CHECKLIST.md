# Runner Relaunch Checklist

- [ ] Apply `20260907193000_runner_published_intelligence.sql`.
- [ ] Confirm RLS is enabled on every `runner_*` table.
- [ ] Confirm explicitly approved Demon publishing with server-side credentials.
- [ ] Apply tracker ownership migration; test two distinct Clerk accounts and legacy-row quarantine.
- [ ] Verify `/api/runner/status` reports engine/provider freshness.
- [ ] Verify live, signals, totals, game-flow, and pick-health routes with
  `sport` and `eventId` filters.
- [ ] Validate MCP read tools with an MCP inspector.
- [ ] Confirm MCP has no command or private command-result tools and no bearer-token input schemas.
- [ ] Confirm source timestamps and stale/unknown states are visible in the
  client experience.
- [ ] Run `npm run build` and `npm run lint`.
- [ ] Do not deploy until provider permissions and production credentials are
  confirmed.
