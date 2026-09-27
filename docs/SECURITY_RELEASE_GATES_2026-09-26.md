# Site security release gates — 2026-09-26

## Implemented locally

- Tracker identity is derived from verified Clerk access in the server-only data
  layer. Every read and summary filters `owner_user_id`; inserts bind the current
  user. Admin entitlement does not grant cross-user reads. Dashboard, analytics
  and Sunday consumers inherit these checks without caller-supplied owner IDs.
- Bootstrap admin and email-based manual grants require a verified primary
  email. A grant already bound to another Clerk ID cannot transfer via email;
  grant lookup uses scalar equality filters rather than interpolated expressions.
- Tracker HTTP routes return 401 before accessing storage for anonymous users,
  403 without entitlement, 404 for a different owner's ID and generic 503 when
  storage fails. Error responses and data responses are non-cacheable.
- HTTP writes reject invalid American odds, invalid calendar dates and
  non-finite optional prices/CLV. Submitted owner fields are ignored.
- MCP advertises reads only, with no secret tool inputs. Legacy command enqueue
  and private result functions reject all calls before accessing a provider.
- `20260926000000_tracker_ownership.sql` adds indexed ownership, revokes direct
  public/anon/authenticated table access, retains RLS and rejects new unowned
  rows. Existing NULL-owner rows remain quarantined. No inferred backfill.

## Verification

`node --test tests/security.test.cjs`: eight regression cases cover anonymous
and unpaid callers, two-user list/summary isolation, foreign/legacy record IDs,
forged insert owner, bad write inputs, masked failures, rejected commands and
MCP registration and verified email/identity-bound grants. Tests execute actual TypeScript modules with mocked Clerk,
Supabase and HTTP boundaries; they do not establish deployed DB policy behavior.

The first combined production build and lint passed. A built-server loopback
smoke check returned 401 with `no-store` for all four anonymous tracker methods/
routes and MCP tools/list returned 200 with 13 read-only tools and no commands.
The test server was stopped. A localhost binding was required for Next's internal
proxy on this Windows machine; the initial 127.0.0.1 binding timed out.
Final verification after the model-field contract and dependency corrections:
`npm test` passed all 16 tests; `npm run build` passed (32 static pages);
`npm run lint` passed; `npm audit --omit=dev` reported zero vulnerabilities;
`git diff --check` passed. Existing warnings remain for Next's inferred workspace
root (multiple lockfiles) and the deprecation of `next lint` ahead of Next 16.

## Required before production release

The coordinating agent verified the intended Supabase project is active and
healthy, with RLS enabled but no live `tracked_bets.owner_user_id` column. The
migration remains required and unapplied. The accessible Vercel team did not
list this Site project; an unrelated similarly named dashboard must not be used
as a deployment substitute.

## Dependency gate

The initial production dependency audit reported three high and one moderate
finding. Compatible lockfile updates install js-yaml 4.3.2 and Sharp 0.35.4.
Next 15.5.25 package metadata explicitly allows Sharp 0.35.4. A scoped
`overrides.next.postcss = 8.5.26` replaces Next's old pinned PostCSS; the direct
PostCSS dependency remains in its existing compatible range (lockfile 8.5.28).
Existing user-added dependencies were preserved.

Official advisory references: [js-yaml merge-source limits](https://github.com/advisories/GHSA-2883-xcg3-v3hh),
[Sharp native dependencies](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c),
[PostCSS source-map loading](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp).
`npm audit --omit=dev` now reports zero vulnerabilities. A native Sharp in-memory
resize/PNG smoke test passed. Recheck the audit at deployment time because
advisory data changes. This override should be revisited when upgrading Next.

## Provider acceptance checklist

1. Review and explicitly authorize applying the migration to the intended
   Supabase project. It has NOT been applied by this local code change. Deploy
   schema before application code; missing ownership schema fails closed (503).
   Quiesce old tracker traffic first, then coordinate schema and application
   rollout. Adding the owner column alone does not protect the old unscoped
   service-role reader. Resume traffic only on the ownership-aware build.
2. In a staging database, verify anon/authenticated roles cannot select or insert
   tracker rows directly, while the server service role can write a valid owner.
3. Use two verified Clerk accounts with entitlement and separate wagers. Verify
   every tracker endpoint plus dashboard and analytics only show the caller's
   rows; guessing the other ID returns 404. Test signed-out and expired access.
4. Confirm `/mcp` tools/list omits all command/result tools in the deployed
   transport. A stale client calling a removed tool must receive unknown-tool.
5. Record verified legacy ownership before any separately approved reconciliation.
   Do not assign legacy rows to an administrator or first signed-in account.

## Recovery and remaining limits

Retain the ownership column, revoked grants and RLS during rollback. Do not roll
back to an application version with unscoped service-role reads: disable tracker
routes or deploy a corrected build. The new constraint can be removed by a
reviewed forward migration if necessary; that alone must not re-enable legacy
reads. No data was deleted or reassigned in this change.

Remote control capability/approval/idempotency design remains unimplemented.
Public research APIs are not made subscriber-only by this change; decide their
intended product access policy separately. Live Supabase/Clerk acceptance and
deployment have not been executed. These local fixes alone are not a production
readiness certification.

## Continuous checks

`npm test` runs both security and market-truth suites. The new
`.github/workflows/quality.yml` runs locked installation, regression tests,
lint, build and `npm audit --omit=dev` on pull requests and production-bound
branch pushes. No repository secrets are passed into this job. The workflow
has been prepared locally; a hosted run cannot be claimed until it is pushed.
