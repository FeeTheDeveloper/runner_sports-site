import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth/config";
import { getBillingCustomer } from "@/lib/billing/subscriptions";
import { billingOrigin } from "@/lib/billing/origin";
import { getVerifiedBillingStripe, isStripeBillingConfigured, matchesBillingMode } from "@/lib/stripe/server";

export async function POST(request: Request) {
  const reply = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
  if (!isClerkConfigured() || !isStripeBillingConfigured()) return reply({ error: "Billing connections are not configured." }, 503);
  const { userId } = await auth();
  if (!userId) return reply({ error: "Sign in to manage billing." }, 401);
  try {
    const origin = billingOrigin(request);
    const customerId = await getBillingCustomer(userId);
    if (!customerId) return reply({ error: "No verified billing connection exists for this account." }, 404);
    const stripe = await getVerifiedBillingStripe();
    const customer = await stripe.customers.retrieve(customerId);
    if (customer.deleted || customer.metadata.clerk_user_id !== userId || !matchesBillingMode(customer.livemode)) return reply({ error: "Billing ownership needs support review." }, 409);
    const portal = await stripe.billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/billing` });
    return reply({ url: portal.url });
  } catch {
    return reply({ error: "Billing is temporarily unavailable or awaiting configuration." }, 503);
  }
}
