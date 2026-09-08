# Runner Integration Contract

The Runner Sports site is the presentation and access layer. The sibling
`runner_sports_demon` owns ingestion, normalization, models, replay, and
intelligence generation.

## Published data

The Demon publishes approved records into the `runner_*` tables created by the
Runner intelligence migration. Records include `as_of`, `updated_at`,
`freshness`, source/payload lineage, and (where relevant) `sport` and
`event_id`. The site never infers a missing forecast or fabricates a live
state.

## Site reads

Server-only modules under `lib/data/runner*.ts` apply bounded limits (1–100)
and optional `sport`, `eventId`, and freshness-age filters. API responses are
`{ data, meta }`, and `meta.freshness` reports `fresh`, `stale`, or `unknown`.
Routes are:

- `/api/runner/status`
- `/api/runner/live`
- `/api/runner/signals`
- `/api/runner/game-flow`
- `/api/runner/totals`
- `/api/runner/pick-health`

The browser never receives service-role credentials. The website uses the
server-only Supabase client and should tolerate an unavailable upstream by
showing a stale/unknown state rather than inventing content.
