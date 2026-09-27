# Owner operations workspace

## Route and authority

`/admin/operations` is a read-only owner workspace linked from `/admin`.
Existing verified Clerk administrator access is required in the server-only
data layer before configuration or receipt queries. Anonymous requests redirect
to sign-in; non-admin requests redirect to account, matching the admin sibling.
There are no remote command, credential reveal, provisioning, deployment,
payment or database mutation controls on this page.

## What the screen proves

- Configuration checks reveal only named presence booleans, never values,
  private endpoint URLs, credentials, raw provider payloads or error bodies.
- Saved engine/provider receipts are fetched on page load from the verified
  Runner Supabase project `vrhvvywncclonfwplsjl` only. Wrong or malformed targets
  are blocked before query dispatch. Missing configuration and failed/empty
  queries have separate messages. Partial query failure preserves other results.
- Receipt age uses engine `heartbeat_at` or provider `last_success_at`, computed
  against the server clock. Under five minutes is RECENT; older receipts are
  STALE. Missing, invalid or future timestamps are UNVERIFIED. Stored freshness
  labels cannot override this calculation. Receipt freshness does not certify
  the underlying model or feed's truth.
- Dated September 26 audit findings are displayed separately from runtime
  configuration and saved receipts. They do not automatically refresh.
- Runner Sports Plug supports operator review. Continuous plugin monitoring
  or autonomous external maintenance is not installed by this workspace.

## Provider handoff and remaining release gates

The inspected Clerk application was development-only; the production-key/domain
binding remains unverified. The healthy Runner Supabase project belonged to Fee
The Developer LLC, but local configuration targeted another project at audit.
The accessible Vercel `runner-dashboard-site` was connected to a different
repository; confirm the target for `FeeTheDeveloper/runner_sports-site`.
The latest Stripe inspection was a Fee The Developer LLC sandbox; an earlier
live Found App account was not established as the Runner merchant.

Resolve these bindings before applying approved migrations or deploying. Then
run production sign-in, two-user tracker, subscriptions/webhook, provider receipt
and backup/restore acceptance checks. The operator checklist does not record
completion or claim that these gates have passed. Maintain the dated audit
entries in `lib/operations/status.ts` from new verified evidence.

## Verification and maintenance

`node --test tests/operations.test.cjs` executes the actual service/page modules
with controlled identity, environment and database boundaries. It covers denied
access before reads, wrong-project denial, secret redaction, stale/future/missing
time handling, partial failure and route redirects. No live credentials are used.
Run this suite with the repository's full tests, build and lint before release.
Browser acceptance must include an authorized admin, denied user, narrow viewport,
keyboard navigation and both themes. Static and unit evidence is not browser or
deployed authorization acceptance.

Local lane verification: all seven operations tests passed, TypeScript
`npx tsc --noEmit --incremental false` passed, and targeted Next lint on the
new page, admin link and operations service passed. The full Premium static
audit recorded three existing findings in `AdminSubscribers.tsx` and
`FilterBar.tsx` in `docs/operations-ui-audit.json`; no finding was in this route.
Combined build, authenticated browser acceptance and release verification belong
to the coordinating release pass. The route inherits the shared application
loading and retry-error boundaries.

The shared Runner freshness helper also expires saved `fresh`/`live` labels using
their timestamps. Explicit provider `delayed`, `stale` and `offline` states are
minimum severity. An invalid authoritative `as_of` is not replaced by a newer
storage timestamp. Aggregate status preserves unavailable records and reports
the newest valid timestamp in UTC, excluding future/invalid dates. Five focused
tests in `tests/runner-freshness.test.cjs` cover this contract.

Visual ownership remains the shared `ProductHeading`, `SectionHeader`, `Badge`,
`runner-card` and semantic theme tokens. This route adds no global token overrides.
Provider dashboard links open separately and perform no operation until the owner
chooses one there. Refreshing the page only rereads configuration and receipts.
