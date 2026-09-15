# Access Control QA — What The Code Actually Enforces Today

This document reflects only what `middleware.ts` and `lib/auth/access.ts`
actually do, as read on `release/runner-production` during this QA pass.
**Neither file was modified during this pass** — both are read-only inputs
here, per the hard constraint that the auth/entitlement system stays
untouched. Anything that requires a live Clerk session, live Stripe webhook
event, or live Supabase row to observe is explicitly marked
**"Not verifiable without a live session"** rather than asserted as PASS.

## The model, as implemented

`lib/auth/access.ts` — `getRunnerAccess()` — returns one `RunnerAccess`
object per request, computed in this order:

1. If Clerk isn't configured (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` +
   `CLERK_SECRET_KEY` both set) → everyone is `NO_ACCESS` (`role: "public"`,
   `fullAccess: false`).
2. If there's no signed-in Clerk user → `NO_ACCESS`.
3. **Admin**: email is in `RUNNER_ADMIN_BOOTSTRAP_EMAILS` (comma-separated
   env var) **or** Clerk `privateMetadata.role === "admin"` → `role: "admin"`,
   `isAdmin: true`, `fullAccess: true`.
4. **Stripe subscriber**: `privateMetadata.runnerPlan` is set **and**
   `privateMetadata.subscriptionStatus` is `"active"` or `"trialing"` →
   `role: "subscriber"`, `source: "stripe"`, `fullAccess: true`. (This
   metadata is written by the Stripe webhook, `app/api/webhooks/stripe`,
   never by the client.)
5. **Manual grant**: an active row in Supabase `manual_access_grants`
   matching the user's Clerk ID or email, not expired → `role: "subscriber"`,
   `source: "manual"`, `fullAccess: true`.
6. Otherwise: `role: "authenticated"`, `fullAccess: false` — a signed-in user
   with no paid/manual/admin access.

`requireAdminAccess()` is just `getRunnerAccess()` gated on `isAdmin`, for
API routes to call.

`middleware.ts` — `isProtectedRoute` is a `createRouteMatcher` covering:
`/account`, `/billing`, `/dashboard`, `/picks`, `/edge`, `/research`,
`/systems`, `/models`, `/tracker`, `/props`, `/markets`,
`/prediction-markets`, `/analytics`, `/games`, `/odds`, `/teams`,
`/players`, `/sportsbooks`, `/admin` (all with `(.*)` suffixes). For any
matched path, `auth.protect()` is called, which redirects a signed-out
visitor to sign-in. If Clerk isn't configured at all
(`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`/`CLERK_SECRET_KEY` missing), the
middleware short-circuits to `NextResponse.next()` for every request —
**no route is protected at all** in that configuration state.

## Access matrix

Legend: **PASS** = verified by reading the enforcing code path. **Not
verifiable without a live session** = the code path exists and looks
correct, but this pass did not exercise it against a real Clerk
session/Stripe subscription/Supabase grant, so it is not asserted as PASS.
**GAP** = a verified, real gap in enforcement (not a guess).

| | Public marketing pages (`/`, `/pricing`, `/sign-in`, `/sign-up`, `/checkout/*`) | "Account" pages (`/account`, `/billing`) | "Runner App" — middleware-gated, not paywalled (`/games`, `/odds`, `/teams`, `/players`, `/sportsbooks`) | "Runner App" — middleware-gated **and** paywalled (`/dashboard`, `/picks`, `/edge`, `/research(/*)`, `/systems`, `/models`, `/tracker`, `/props`, `/markets`, `/prediction-markets`, `/analytics`) | Admin (`/admin`, `/api/admin/*`) |
|---|---|---|---|---|---|
| **Anonymous** (no Clerk session) | **PASS** — allowed; these paths are absent from `isProtectedRoute` | **PASS (blocked)** — `isProtectedRoute` matches `/account`/`/billing`; `auth.protect()` redirects to sign-in | **PASS (blocked)** — matched by `isProtectedRoute`, redirected to sign-in | **PASS (blocked)** — matched by `isProtectedRoute`, redirected to sign-in | **PASS (blocked)** — `/admin` is in `isProtectedRoute`; page also self-checks and would redirect even if middleware were bypassed |
| **Registered** (signed in, `fullAccess: false` — no admin/Stripe/manual grant) | **PASS** — allowed (not gated) | **PASS** — allowed; both pages render without calling `getRunnerAccess().fullAccess` | **PASS** — allowed; these 5 routes are middleware-gated (sign-in only) but **do not** call `getRunnerAccess()`/`Paywall` at all — confirmed by reading every page file. **This means any signed-in user, paid or not, can view live odds, team/player intelligence, and the sportsbook list.** | **PASS (blocked)** — every one of these pages calls `getRunnerAccess()` and returns `<Paywall>` when `fullAccess` is false; confirmed present in all 13 (11 top-level + `research/[sport]` + `research/injuries`) | **PASS (blocked)** — `/admin` redirects to `/account` when `!isAdmin`; `/api/admin/*` returns via `requireAdminAccess()` returning `null` |
| **Paid Subscriber** (`source: "stripe"`, `entitlement: "active"`/`"trial"`) | **PASS** — allowed | **PASS** — allowed | **PASS** — allowed | **Not verifiable without a live session** — the `fullAccess` check itself is straightforward to read, but reaching this state requires a real Stripe subscription synced via the webhook into Clerk `privateMetadata`; not exercised live in this pass | **PASS (blocked)** — `role: "subscriber"` is never `isAdmin: true` unless also bootstrap/meta-admin |
| **Manual Subscriber** (`source: "manual"`, active `manual_access_grants` row) | **PASS** — allowed | **PASS** — allowed | **PASS** — allowed | **Not verifiable without a live session** — requires a real Supabase `manual_access_grants` row keyed to a live Clerk user/email; the query logic (`findActiveManualGrant`) was read and looks correct (checks `active=true` and unexpired), but not exercised against live data in this pass | **PASS (blocked)** — same as above |
| **Admin** (`RUNNER_ADMIN_BOOTSTRAP_EMAILS` or `privateMetadata.role==="admin"`) | **PASS** — allowed | **PASS** — allowed | **PASS** — allowed | **PASS** — `isAdmin` implies `fullAccess: true`, bypassing every `Paywall` check | **Not verifiable without a live session** — `requireAdminAccess()`'s logic is straightforward, but exercising a real bootstrap-email or Clerk-metadata admin login was not done in this pass |

## Verified gaps (documented, not fixed — outside this pass's scope)

These are real, code-verified gaps. Per the task's hard constraint, the
auth/entitlement system (`lib/auth/access.ts`, `middleware.ts`, and any
`app/api/*` route) was **read only, not modified**, in this pass — these
are recorded here for the team to decide on and fix in a dedicated change.

### 1. No API-layer auth at all on most data routes

`middleware.ts`'s `config.matcher` does run the middleware function for
`/(api|trpc)(.*)` — but `isProtectedRoute` (the list middleware actually
checks before calling `auth.protect()`) contains **zero** `/api/*` entries.
So `auth.protect()` is never invoked for any API route; whatever protection
exists is only whatever each route implements for itself.

Grepped every `app/api/**/route.ts` for `getRunnerAccess`,
`requireAdminAccess`, `auth()`, or `currentUser()`. Result:

- **No auth check at all** (any anonymous caller can hit these directly,
  bypassing both the middleware and every page-level `Paywall`):
  `app/api/games`, `app/api/games/[id]`, `app/api/edges`,
  `app/api/edges/[id]`, `app/api/markets`, `app/api/markets/[id]`,
  `app/api/models`, `app/api/models/[id]`, `app/api/props`,
  `app/api/props/[id]`, `app/api/signals`, `app/api/signals/[id]`,
  `app/api/sports`, `app/api/sports/[id]`, `app/api/prediction-markets`,
  `app/api/espn/records`, `app/api/runner/game-flow`,
  `app/api/runner/live`, `app/api/runner/pick-health`,
  `app/api/runner/signals`, `app/api/runner/status`,
  `app/api/runner/totals`, `app/api/health`.
- **Most significant**: `app/api/tracker` (`GET` **and** `POST`) and
  `app/api/tracker/[id]`, `app/api/tracker/summary` — an anonymous caller
  can both **read** every logged bet and **write new tracked-bet rows**
  directly via `curl`/`fetch`, with no session check whatsoever. The
  equivalent `/tracker` and `/analytics` pages are middleware- and
  Paywall-gated for browser navigation, but that protection does not
  extend to the API these pages (and anyone else) call.
- **Correctly protected** (confirmed, for contrast): `app/api/admin/*` all
  call `requireAdminAccess()` and return an error when it's `null`;
  `app/api/checkout` and `app/api/billing/portal` both call Clerk's
  `auth()` and return 401 without a `userId`; `app/api/webhooks/stripe`
  verifies the Stripe signature (`stripe.webhooks.constructEvent`) instead
  of using Clerk auth, which is the correct pattern for a webhook;
  `app/api/cron/*` routes use their own `authorizeCronRequest()` /
  `CRON_SECRET` check, which is the correct pattern for a cron trigger, not
  a gap.

### 2. Five "Runner App" pages are sign-in-gated only, not paywalled

`/games`, `/odds`, `/teams`, `/players`, `/sportsbooks` are in
`middleware.ts`'s `isProtectedRoute` list (so anonymous visitors are
redirected to sign-in), but none of their `page.tsx` files call
`getRunnerAccess()` or render `<Paywall>`. Any signed-in user — including
one with `fullAccess: false` and no payment on file — can view live odds,
the full game slate, team/player intelligence, and the sportsbook list.

This reads as though it could be an intentional "free tier" (the
`/pricing` page's free "Runner Scout" plan literally advertises "Live event
board" and "Public odds comparison" as free-tier features, which lines up
with `/games`/`/odds` being open to any signed-in user) — but it was not
possible to confirm that intent from the code alone, and it is exactly the
kind of thing this document is meant to flag rather than silently assume is
correct. Worth confirming against the product spec/team before treating it
as either "working as intended" or "a gap to close."

### 3. `RUNNER_ADMIN_BOOTSTRAP_EMAILS` grants full admin, including `/api/admin/*` write access

Anyone whose Clerk primary email is in this comma-separated env var is
`isAdmin: true` — including the ability to grant/revoke `manual_access_grants`
for other users via `/api/admin/*`. This is presumably intentional
(a bootstrap mechanism for the first admin before Clerk role metadata is
set), but it means the env var's value is a genuine admin allowlist and
should be treated with the same care as a credential — confirmed by
reading the code, not asserting anything about its current value (which
was never read or printed during this pass).

## Notes on verification method

- All PASS rows above come from reading `lib/auth/access.ts`,
  `middleware.ts`, and every gated page's own `getRunnerAccess()`/`Paywall`
  call (or lack thereof) — not from running the app.
- No `.env` values were read, printed, or altered. `isClerkConfigured()`
  and `isStripeConfigured()` were read as functions, not invoked against
  real secrets.
- No dev server was started and no live Clerk/Stripe/Supabase session was
  exercised during this pass; every "Not verifiable without a live session"
  row above is a deliberate call not to guess PASS on runtime behavior this
  pass could not observe.
