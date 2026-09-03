import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";

async function updateSubscriptionMetadata(
  clerkUserId: string,
  values: { stripeCustomerId?: string; stripeSubscriptionId?: string; runnerPlan?: string; subscriptionStatus?: string },
) {
  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, { privateMetadata: values });
}

function asId(value: string | { id: string } | null) {
  return typeof value === "string" ? value : value?.id;
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook verification is not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const clerkUserId = session.client_reference_id ?? session.metadata?.clerk_user_id;
    if (clerkUserId) {
      await updateSubscriptionMetadata(clerkUserId, {
        stripeCustomerId: asId(session.customer),
        stripeSubscriptionId: asId(session.subscription),
        runnerPlan: session.metadata?.runner_plan,
        subscriptionStatus: session.status ?? "complete",
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const clerkUserId = subscription.metadata.clerk_user_id;
    if (clerkUserId) {
      await updateSubscriptionMetadata(clerkUserId, {
        stripeCustomerId: asId(subscription.customer),
        stripeSubscriptionId: subscription.id,
        runnerPlan: subscription.metadata.runner_plan,
        subscriptionStatus: subscription.status,
      });
    }
  }

  return NextResponse.json({ received: true });
}
