# Runner identity, subscriptions and usage contract

## Local implementation

- Clerk is the authentication authority. The approved frontend instance and
  key modes must match before identity is considered configured.
- Supabase is the subscription/access mirror. Its server client requires an
  exact `SUPABASE_EXPECTED_PROJECT_REF`/HTTPS project-origin match before using
  a service-role credential. Billing storage does not require an Odds API key.
- Stripe is the billing authority. Checkout, portal and webhook processing
  verify `STRIPE_EXPECTED_ACCOUNT_ID`; prices/events must match
  `STRIPE_BILLING_MODE=test|live`. Missing or inconsistent connections fail closed.
- Customer ownership is derived from the authenticated Clerk ID and stored in
  `runner_billing_customers`. Existing customer IDs require matching Stripe
  customer metadata before binding. Unique constraints prevent reassignment.
- Checkout checks the actual configured active recurring licensed Stripe price,
  rejects existing non-terminal subscriptions, reuses open same-plan checkout
  sessions and uses server-derived customer/checkout idempotency keys. The
  canonical configured origin supplies success/cancel/portal URLs; foreign
  Origin headers are rejected. Final monetary amounts are shown by Stripe.
- Webhook signatures are checked against the raw body. Relevant events retrieve
  current subscription state rather than trusting an old event payload or
  treating Checkout `complete` as subscription `active`. Connected-account and
  wrong-mode events cannot grant access.
- One database transaction derives ownership, journals each event once, applies
  a subscription snapshot and marks its outcome. The observation timestamp is
  obtained from the database before fetching Stripe, avoiding worker clock skew.
  Earlier-started observations cannot overwrite later-started observations.
  This orders local reconciliation attempts; it is not proof of Stripe's upstream
  snapshot ordering. Delayed provider responses and concurrent changes still
  require lifecycle acceptance tests and a monitored reconciliation procedure.
  Persistence failure returns
  503 for Stripe retry; there is no partial Clerk entitlement write.
- Plan identity comes only from a unique configured price ID, one subscription
  item and quantity one. `runner_plan` metadata is not entitlement authority.
- An active/trialing subscription must have a recognized plan, future period end,
  correct merchant and matching test/live mode. Old Clerk billing metadata never
  grants access. Verified manual/admin grants retain their established behavior.

## Tiers, models and usage

The existing paid tiers are `pro` and `command`. The mirror distinguishes them;
both retain current research/tracker access until different approved terms exist.
No price, usage allowance, model tier or unlimited entitlement was invented.

`GET /api/billing/status` requires authentication and returns private no-store
plan/entitlement/expiry/billing-state data. Current model execution is explicitly
unavailable (`predictionExecution: false`). Usage is `not_configured`, with
null limit/used/remaining values. A subscription cannot activate an unavailable
or unvalidated prediction model. There is no metered execution route yet.

Before enabling paid model runs, approve a model catalog, tier-to-capability
matrix, units and billing/reset period. Implement a transactional usage reservation
with idempotency, atomic limit checks, execution receipts and failure refunds.
Do not count usage in browser storage or in a read-then-write request sequence.

## Provider setup still required

No environment secret, provider configuration, product, price, webhook,
subscription, migration or deployment was mutated by this implementation.

1. Confirm the Runner Clerk production application and approved frontend host.
   Set matching public/server keys and `CLERK_EXPECTED_FRONTEND_API` through the
   deployment secret store. The inspected development app and local live-key
   binding were not proven to be the same application.
2. Reconcile the Supabase connection to the verified Runner project
   `vrhvvywncclonfwplsjl`. The audited local URL targeted a different project.
   Set `SUPABASE_EXPECTED_PROJECT_REF` and matching project URL/service key.
3. Review/apply `20260926000000_tracker_ownership.sql` and
   `20260926010000_billing_entitlements.sql` only after exact project approval.
   Quiesce old tracker/billing traffic during the coordinated schema/app rollout.
4. Confirm the Stripe merchant account. An inspected sandbox or unrelated live
   merchant is not automatic authorization to connect it. Configure
   `STRIPE_EXPECTED_ACCOUNT_ID`, `STRIPE_BILLING_MODE`, the matching restricted
   key, and two distinct recurring Price IDs. Required API permissions include
   account/price/customer/subscription reads, customer and Checkout creation,
  and Customer Portal session creation. Configure the portal in that merchant.
   Keep `RUNNER_CHECKOUT_ENABLED=false` until plan terms, model/usage policy and
   sandbox acceptance are approved. Existing portal access does not depend on
   enabling new subscriptions; customers must retain the ability to cancel.
5. Configure a signing secret for `/api/webhooks/stripe` with:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `customer.subscription.created`, `customer.subscription.updated`, and
   `customer.subscription.deleted`. Renewal/payment failure status changes must
   be exercised in the approved sandbox. Webhook retries must be monitored.
6. Reconcile existing customers/subscriptions deliberately. Old Clerk metadata
   alone is not a backfill. Verify each customer/user/merchant binding and replay
   authoritative Stripe state before permitting existing paid access. Never
   infer ownership from an email address or copy records between merchants.
7. Approve exact paid capability and usage terms before enabling model execution.

## Acceptance and recovery

Checkout creation uses a persisted per-owner attempt ID and two-minute database
lease, not a wall-clock bucket. Competing requests receive a busy response. A
retry after an unknown/lost response retains its Stripe idempotency key. Rotation
requires the exact previously recorded session plus provider confirmation of
expiry, or completion with a terminal subscription. Empty lists and network errors
cannot rotate unknown attempts. Lease tokens fence stale workers' local writes;
the stable Stripe idempotency key prevents duplicate creation after lease recovery.
The checkout route has a 60-second deployment execution limit; recovery is gated
by the longer lease. Reusing an open session also verifies its actual line item,
quantity, customer and configured mode. Unknown attempts require retrying the
original plan or explicit billing support reconciliation.
An unrecorded attempt older than 23 hours cannot create another session: the
database returns `review_required` before Stripe's minimum 24-hour idempotency
retention can expire. Its identity is retained for investigation, not silently
rotated. This limit is measured from the persisted database creation timestamp.

Local tests execute the TS policy/routes against controlled provider boundaries
and the real SQL migration/functions in an isolated PGlite PostgreSQL database.
They cover configured-price mapping, expiry, rejected host/project bindings,
stale Clerk metadata, signature/current-state/retry handling, owner verification,
duplicate checkout reuse, atomic event deduplication, stale observations,
ownership conflicts, rollback audit integrity and revoked public-role access.
These tests do not claim hosted Supabase RLS, live Clerk sessions or real payment
acceptance. Complete two-account sandbox lifecycle tests before any live rollout.

Verification after this billing lane: all 43 combined tests passed; TypeScript
checking passed; production dependency audit reported zero vulnerabilities; diff
checking passed. Full combined build/lint is coordinated by the parent release
lane. No live account, payment, hosted migration or production webhook was tested.

Restore service with a forward fix while retaining ownership tables, event
receipts and RLS. Never roll back to the old metadata-only entitlement or
unscoped tracker readers. Review ownership before changing merchant/project pins.

Stripe references: [webhook verification and delivery behavior](https://docs.stripe.com/webhooks),
[subscription lifecycle events](https://docs.stripe.com/billing/subscriptions/webhooks),
[idempotent API requests](https://docs.stripe.com/api/idempotent_requests).
