import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripePriceId, PAID_PLANS } from "@/lib/billing/plans";
import { isClerkConfigured } from "@/lib/auth/config";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

const checkoutSchema = z.object({ plan: z.enum(["pro", "command"]) });
const integrationIdentifier = "runner_web_qkzmpvta";

function appOrigin(request: Request) {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isClerkConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Clerk and Stripe must be configured before checkout can open." }, { status: 503 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid Runner access level." }, { status: 400 });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in before starting checkout." }, { status: 401 });

  const priceId = getStripePriceId(parsed.data.plan);
  if (!priceId) return NextResponse.json({ error: "This Stripe price has not been configured yet." }, { status: 503 });

  const [user, clerk] = await Promise.all([currentUser(), clerkClient()]);
  if (!user) return NextResponse.json({ error: "Runner account not found." }, { status: 404 });

  const stripe = getStripe();
  const privateMetadata = user.privateMetadata as Record<string, unknown>;
  let customerId = typeof privateMetadata.stripeCustomerId === "string" ? privateMetadata.stripeCustomerId : undefined;

  if (!customerId) {
    const email = user.primaryEmailAddress?.emailAddress;
    const customer = await stripe.customers.create({
      ...(email ? { email } : {}),
      name: user.fullName ?? undefined,
      metadata: { clerk_user_id: userId },
    });
    customerId = customer.id;
    await clerk.users.updateUserMetadata(userId, { privateMetadata: { stripeCustomerId: customerId } });
  }

  const origin = appOrigin(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    customer_update: { address: "auto", name: "auto" },
    metadata: { clerk_user_id: userId, runner_plan: parsed.data.plan },
    subscription_data: { metadata: { clerk_user_id: userId, runner_plan: parsed.data.plan } },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    integration_identifier: integrationIdentifier,
  });

  if (!session.url) return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  return NextResponse.json({ url: session.url, plan: PAID_PLANS[parsed.data.plan].name });
}
