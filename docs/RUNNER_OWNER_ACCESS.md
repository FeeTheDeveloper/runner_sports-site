# Runner Owner Access — Permanent Single-Account Tier

Recorded 2026-09-28 on `feature/runner-owner-access`.

Authoritative for the owner tier. The older
[access control QA](ACCESS_CONTROL_QA.md) describes the pre-owner ordering and
is historical from this date forward.

## What this is

Exactly one account is the **Runner owner**. That account holds permanent,
unrestricted access to every Runner surface and is the only account that
renders the exclusive owner badge. No billing state, lapsed subscription,
expired grant or Stripe outage can reduce it.

The owner is **not** a plan. It is a tier above every plan, and it never
claims a paid plan it did not buy (`paidPlan` stays `null`).

## Where the identity lives

| Layer | Value | Purpose |
|---|---|---|
| `RUNNER_OWNER_EMAIL` (env) | one verified email address | Primary. Grants the `owner` tier. |
| `manual_access_grants` row (Supabase) | same address, `expires_at = null` | Backstop. Grants `manual_access` (full access, not admin) if the env var is ever unset or misconfigured. |

The address is **configured, never committed**. The repository carries no
personal address: `.env.example` documents the variable name only, and the
tests use the synthetic fixture `owner@runner.test`.

`RUNNER_OWNER_EMAIL` takes **exactly one** address. A comma list is rejected
and yields *no owner at all* — see "Fails closed" below.

## Resolution order in `getRunnerAccess()`

`lib/auth/access.ts` resolves one tier per request, in this order:

1. Clerk not configured, or no signed-in user → `NO_ACCESS`.
2. **Owner** — verified email equals `RUNNER_OWNER_EMAIL` →
   `role: "owner"`, `entitlement: "owner"`, `source: "owner"`,
   `fullAccess: true`, `isAdmin: true`, `isOwner: true`, `expiresAt: null`.
3. Admin — `RUNNER_ADMIN_BOOTSTRAP_EMAILS` or Clerk `privateMetadata.role`.
4. Stripe subscriber — active/trialing row in the Supabase billing mirror.
5. Manual grant — active, unexpired `manual_access_grants` row.
6. Otherwise — signed in, no full access.

The owner is deliberately checked **first**, before Stripe and before the
grants table are consulted at all. Neither can revoke it, and neither is even
queried for the owner (asserted by test).

## Security properties

Each is covered by a test in `tests/owner-access.test.cjs`:

- **Verified email only.** `getRunnerAccess()` passes an address to
  `isOwnerEmail()` only when Clerk reports the primary address as `verified`.
  An unverified address matching the owner gets no owner access — otherwise
  anyone could claim ownership by typing it into a profile field.
- **Fails closed.** Unset, malformed, or more than one address → no owner.
  An ambiguous configuration never picks a winner.
- **Exclusive.** No other account carries `isOwner`, including paid
  subscribers, bootstrap admins, metadata admins and comped accounts. The
  badge renders on `isOwner` alone.
- **Not displaceable.** Admin metadata and an active subscription on the owner
  account still resolve to the owner tier, and a subscription period never
  caps `expiresAt`.
- **Exact match.** Case and surrounding whitespace are normalized; nothing
  else matches. Suffix lookalikes (`owner@runner.test.evil.com`) are rejected.

## The badge

`components/ui/OwnerBadge.tsx`, defined by `OWNER_BADGE` in
`lib/auth/owner.ts`. Gold (`--color-warning`) with a crest mark, deliberately
unlike the brand-red `Badge` used for routine labels, so it is not mistaken
for an ordinary status chip. Rendered on `/account` beside the account name.
A `compact` variant exists for chrome.

The badge is presentation only. It confers nothing; `isOwner` does.

## Revoking

Both layers must be cleared, or the backstop keeps full access alive:

1. Unset `RUNNER_OWNER_EMAIL` in `.env.local` and in Vercel, then redeploy.
2. `update manual_access_grants set active = false, revoked_at = now(),
   revoked_by = '<who>' where id = '<grant id>';`

## Open items

- **Vercel is not set from here.** `RUNNER_OWNER_EMAIL` was set in
  `.env.local` only. Production has no owner until the variable is added to
  the Vercel project and redeployed.
- **`.env.local` `SUPABASE_URL` is stale.** It points at project
  `ntkicqxydbiqbbkzotbp`, which does not resolve (DNS `ENOTFOUND`). The live
  Runner schema is project `vrhvvywncclonfwplsjl` ("Runner Sports"), where the
  backstop grant was written. Local runs that touch Supabase will fail until
  this is corrected.
- **`RUNNER_ADMIN_BOOTSTRAP_EMAILS` looks misspelled.** Its single entry is on
  domain `@wereunsportsandanalytics.com` ("wereun"), not
  `werunsportsandanalytics.com`. If that is a typo, bootstrap admin currently
  matches nobody. Not changed here — it is a separate decision.
- The backstop grant has `clerk_user_id = null`, so it binds to the first
  verified Clerk identity presenting that address, as the existing grant code
  requires for email matching.
