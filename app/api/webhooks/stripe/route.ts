import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, getVerifiedBillingStripe, isStripeBillingConfigured, matchesBillingMode } from "@/lib/stripe/server";
import { billingObservationTime, reconcileSubscriptionEvent } from "@/lib/billing/subscriptions";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !isStripeBillingConfigured()) return NextResponse.json({ error: "Webhook connection is not configured." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  const stripe = getStripe();
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await request.text(), signature, secret); }
  catch { return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 }); }
  if (event.account) return NextResponse.json({ received: true, ignored: "connected_account" });
  if (!matchesBillingMode(event.livemode)) return NextResponse.json({ error: "Webhook mode does not match this environment." }, { status: 400 });
  let subscriptionId: string | undefined;
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.mode === "subscription") subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
  } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
    subscriptionId = (event.data.object as Stripe.Subscription).id;
  }
  if (!subscriptionId) return NextResponse.json({ received: true, ignored: true });
  try {
    await getVerifiedBillingStripe();
    // Fetch current provider truth even for an old or checkout-completed event.
    // Checkout completion itself is never a subscription entitlement.
    const observedAt = await billingObservationTime();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (subscription.livemode !== event.livemode) throw new Error("Stripe mode mismatch.");
    const result = await reconcileSubscriptionEvent(event, subscription, observedAt);
    return NextResponse.json({ received: true, result });
  } catch {
    // Non-2xx asks Stripe to retry; there is no partial Clerk entitlement write.
    return NextResponse.json({ error: "Subscription synchronization is temporarily unavailable." }, { status: 503 });
  }
}
