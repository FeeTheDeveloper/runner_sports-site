# Runner pricing decision — September 27, 2026

Owner-approved tier and pricing structure. Supersedes the open questions in `SUBSCRIPTION_OFFER_VETERAN_REVIEW_2026-09-27.md` regarding tiers, prices and the veteran discount rate.

## Approved catalogue

| Tier | Plan ID | Monthly | Yearly | Lifetime |
| --- | --- | --- | --- | --- |
| Runner Plus | `plus` | $19.99 | $150 | — |
| Runner Pro | `pro` | $49.99 | $300 | — |
| Runner Premium | `premium` | — | $500 | — |
| Runner Premium Plus | `premium_plus` | — | — | $1,500 one-time |

Runner Scout remains the free tier and is unchanged. `Runner Command` is retired; `plus`, `premium` and `premium_plus` are new plan identifiers.

Annual pricing is a deliberate discount against monthly: Plus saves 37.5% ($239.88 → $150), Pro saves 50% ($599.88 → $300).

## Military and veteran benefit

- **20% discount** (raised from the previous 15% veteran rate).
- **3-day free trial**, military and veterans only, granted only after verification.

Both are granted solely from the server-side verification decision recorded by the Hutchrok callback in Clerk `privateMetadata.veteranDiscountStatus === "approved"`. Never from client input, a self-declared flag, a filename, or an uploaded image.

The trial is a subscription concept, so it is never applied to the Premium Plus lifetime purchase — `trialDaysFor()` returns `undefined` for it.

## Implementation

- `lib/billing/plans.ts` — the catalogue, with each price carrying its owner-approved `amountCents`.
- `lib/billing/veteranDiscount.ts` — 20% discount, 3-day trial, and the verification/lifetime gates.
- `app/api/checkout/route.ts` — accepts `{ plan, interval }`, selects Stripe `mode` per tier, and verifies the price before creating a session.
- `app/pricing/page.tsx` — four tiers with real amounts and per-interval buttons.
- `lib/auth/access.ts` — tier precedence now uses `planRank()` rather than a hardcoded tier name.

### Amount verification

Approved amounts are declared in code and `assertPriceMatches()` refuses checkout when the Stripe price disagrees on amount, currency, active state, cadence or usage type. Since Price IDs are pasted into environment variables by hand, this is the guard that stops a mis-pasted ID from charging the wrong number. Stripe remains authoritative for what is actually charged; the catalogue is the approved intent it is checked against.

### Lifetime purchases

Premium Plus uses Stripe `mode: "payment"`, not `"subscription"`. A completed one-time purchase is never replaced by a new checkout attempt. Note that a lifetime purchase does not currently create a subscription row, so entitlement for it still resolves through the manual-grant or webhook path — **reconciliation for one-time purchases is not yet implemented** and must be built before Premium Plus is sold.

### Discount stacking

Stripe rejects `discounts` together with `allow_promotion_codes`. When a verified military discount applies, the coupon is attached and promotion codes are disabled for that session, so the military discount does not stack with promo codes. This matches the no-stacking position in the earlier handoff.

## Environment contract

Replaced `STRIPE_PRICE_RUNNER_PRO`, `STRIPE_PRICE_RUNNER_COMMAND` and `STRIPE_COUPON_VETERAN15` with:

`STRIPE_PRICE_RUNNER_PLUS_MONTHLY` · `STRIPE_PRICE_RUNNER_PLUS_YEARLY` · `STRIPE_PRICE_RUNNER_PRO_MONTHLY` · `STRIPE_PRICE_RUNNER_PRO_YEARLY` · `STRIPE_PRICE_RUNNER_PREMIUM_YEARLY` · `STRIPE_PRICE_RUNNER_PREMIUM_PLUS_LIFETIME` · `STRIPE_COUPON_MILITARY20`

## Open items before selling

1. **Stripe objects do not exist.** No products, prices or the 20% coupon have been created. The September 27 inspection of `acct_1UDP8yGaL1vd8SxJ` found one unrelated $500 Investment Fund product and no coupons. These must be created by the owner in Stripe; the Stripe connector is not authorized in this session.
2. **One-time purchase reconciliation** for Premium Plus, per above.
3. **Does the 20% apply to the lifetime purchase?** Currently it does, since the coupon is attached to any checkout for a verified account. Confirm or restrict.
4. **Does the 20% stack with annual pricing?** Currently yes — 20% off whichever price is chosen, including the already-discounted annual rates. Confirm.
5. **Evidence handling.** The private evidence upload, reviewer workflow, retention schedule and `verify@hutchrok.com` reviewer binding from the earlier review remain unbuilt.
6. `RUNNER_CHECKOUT_ENABLED` stays `false` until 1–5 are resolved and terms are verified in the merchant dashboard.

## Verification

`npx tsc --noEmit` clean · `npm run build` compiles 33 pages · `npm test` 45/45 pass, including new coverage for amount mismatch, interval restrictions, lifetime mode and the verification-gated trial.
