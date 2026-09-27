import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  assertPriceMatches,
  BILLING_INTERVALS,
  getStripePriceId,
  isLifetime,
  PAID_PLANS,
  PAID_PLAN_IDS,
  planForStripePrice,
  priceSpec,
} from "@/lib/billing/plans";
import { billingOrigin } from "@/lib/billing/origin";
import { bindBillingCustomer, getBillingCustomer } from "@/lib/billing/subscriptions";
import { beginCheckoutAttempt, finishCheckoutAttempt, rotateCheckoutAttempt } from "@/lib/billing/checkoutAttempt";
import { isClerkConfigured } from "@/lib/auth/config";
import { getMilitaryCouponId, trialDaysFor } from "@/lib/billing/veteranDiscount";
import { getVerifiedBillingStripe, isCheckoutEnabled, matchesBillingMode } from "@/lib/stripe/server";

const checkoutSchema = z.object({
  plan: z.enum(PAID_PLAN_IDS as [string, ...string[]]),
  interval: z.enum(BILLING_INTERVALS as unknown as [string, ...string[]]),
}).strict();

const response = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!isClerkConfigured() || !isCheckoutEnabled()) return response({ error: "New subscriptions are not available yet." }, 503);
  const { userId } = await auth();
  if (!userId) return response({ error: "Sign in before starting checkout." }, 401);
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return response({ error: "Choose a valid Runner access level." }, 400);

  const plan = parsed.data.plan as keyof typeof PAID_PLANS;
  const interval = parsed.data.interval as Parameters<typeof priceSpec>[1];

  // Premium is sold yearly only; Premium Plus is a one-time lifetime purchase.
  if (!priceSpec(plan, interval)) return response({ error: `${PAID_PLANS[plan].name} is not sold on that billing interval.` }, 400);
  const lifetime = isLifetime(plan, interval);

  try {
    const origin = billingOrigin(request);
    const priceId = getStripePriceId(plan, interval);
    if (!priceId) return response({ error: "This access level has not been configured yet." }, 503);
    const resolved = planForStripePrice(priceId);
    if (!resolved || resolved.plan !== plan || resolved.interval !== interval) {
      return response({ error: "This Stripe price has not been configured uniquely." }, 503);
    }

    const stripe = await getVerifiedBillingStripe();
    const price = await stripe.prices.retrieve(priceId);
    if (!matchesBillingMode(price.livemode)) return response({ error: "This Stripe price is in the wrong mode." }, 503);
    // Refuses a price whose amount, currency or cadence differs from the approved catalogue.
    const mismatch = assertPriceMatches(plan, interval, price);
    if (mismatch) return response({ error: mismatch }, 503);

    const [user, clerk] = await Promise.all([currentUser(), clerkClient()]);
    if (!user || user.id !== userId) return response({ error: "Runner account not found." }, 401);

    // The trial and the military discount are granted only from the server-side
    // verification decision recorded by the Hutchrok callback. Never from client input.
    const verifiedMilitary = (user.privateMetadata as Record<string, unknown>).veteranDiscountStatus === "approved";
    const trialDays = trialDaysFor(verifiedMilitary, lifetime);
    const militaryCoupon = verifiedMilitary ? getMilitaryCouponId() : undefined;

    let customerId = await getBillingCustomer(userId);
    const prior = user.privateMetadata as Record<string, unknown>;
    if (!customerId && typeof prior.stripeCustomerId === "string") customerId = prior.stripeCustomerId;
    if (customerId) {
      const customer = await stripe.customers.retrieve(customerId);
      if (customer.deleted || customer.metadata.clerk_user_id !== userId || !matchesBillingMode(customer.livemode)) return response({ error: "Billing ownership needs support review." }, 409);
    } else {
      const customer = await stripe.customers.create({ metadata: { clerk_user_id: userId } }, { idempotencyKey: `runner:customer:${userId}` });
      customerId = customer.id;
    }
    await bindBillingCustomer(userId, customerId);
    await clerk.users.updateUserMetadata(userId, { privateMetadata: { stripeCustomerId: customerId } });

    let attempt = await beginCheckoutAttempt(userId, plan, priceId);
    if (!attempt) return response({ error: "Another checkout is opening. Please try again shortly." }, 409);
    if (attempt === "review_required") return response({ error: "Your earlier checkout needs billing support review before another can open." }, 409);
    let leaseActive = true;
    const mode = lifetime ? "payment" : "subscription";
    try {
      const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
      if (subscriptions.has_more || subscriptions.data.some(sub => !["canceled", "incomplete_expired"].includes(sub.status))) {
        return response({ error: "A subscription already exists. Manage changes through billing." }, 409);
      }
      const sessions = await stripe.checkout.sessions.list({ customer: customerId, status: "open", limit: 100 });
      if (sessions.has_more) return response({ error: "Existing checkouts require billing review." }, 409);
      const openSessions = sessions.data.filter(session => session.mode === mode);
      if (openSessions.length > 1) return response({ error: "Multiple checkouts need billing support review." }, 409);
      const open = openSessions[0];
      if (open) {
        const items = await stripe.checkout.sessions.listLineItems(open.id, { limit: 2 });
        if (open.metadata?.runner_plan !== plan || open.metadata?.runner_interval !== interval || !open.url || !matchesBillingMode(open.livemode) ||
            items.has_more || items.data.length !== 1 || items.data[0].price?.id !== priceId || items.data[0].quantity !== 1) {
          return response({ error: "Finish your existing checkout before changing plans, or contact billing support." }, 409);
        }
        await finishCheckoutAttempt(userId, attempt, open.id); leaseActive = false;
        return response({ url: open.url, plan: PAID_PLANS[plan].name });
      }
      if (attempt.stripe_session_id) {
        const previous = await stripe.checkout.sessions.retrieve(attempt.stripe_session_id);
        let mayReplace = previous.status === "expired";
        if (previous.status === "complete") {
          if (previous.subscription) {
            const priorSubscription = await stripe.subscriptions.retrieve(typeof previous.subscription === "string" ? previous.subscription : previous.subscription.id);
            mayReplace = ["canceled", "incomplete_expired"].includes(priorSubscription.status);
          } else {
            // A completed one-time purchase is never replaced by a new attempt.
            mayReplace = false;
          }
        }
        if (!mayReplace) return response({ error: "Your previous checkout is still being processed. Check billing before trying again." }, 409);
        attempt = await rotateCheckoutAttempt(userId, attempt, plan, priceId);
      }
      if (attempt.plan !== plan || attempt.price_id !== priceId) return response({ error: "Retry your original plan or contact billing support before changing checkout." }, 409);

      const metadata = { clerk_user_id: userId, runner_plan: plan, runner_interval: interval };
      const session = await stripe.checkout.sessions.create({
        mode, customer: customerId, client_reference_id: userId,
        line_items: [{ price: priceId, quantity: 1 }],
        // Stripe rejects `discounts` together with `allow_promotion_codes`, so an
        // automatically applied military discount does not stack with promo codes.
        ...(militaryCoupon ? { discounts: [{ coupon: militaryCoupon }] } : { allow_promotion_codes: true }),
        billing_address_collection: "auto",
        metadata,
        ...(lifetime ? {} : { subscription_data: { metadata, ...(trialDays ? { trial_period_days: trialDays } : {}) } }),
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
      }, { idempotencyKey: `runner:checkout:${attempt.attempt_id}` });
      if (!session.url) return response({ error: "Stripe did not return a checkout URL." }, 502);
      await finishCheckoutAttempt(userId, attempt, session.id); leaseActive = false;
      return response({ url: session.url, plan: PAID_PLANS[plan].name });
    } finally {
      if (leaseActive) await finishCheckoutAttempt(userId, attempt).catch(() => {});
    }
  } catch {
    return response({ error: "Billing is temporarily unavailable or awaiting configuration. No access was granted." }, 503);
  }
}
