import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth/config";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";

export async function POST(request: Request) {
  if (!isClerkConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ error: "Clerk and Stripe must be configured before billing can open." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to manage billing." }, { status: 401 });

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(userId);
  const metadata = user.privateMetadata as Record<string, unknown>;
  const customerId = typeof metadata.stripeCustomerId === "string" ? metadata.stripeCustomerId : undefined;
  if (!customerId) return NextResponse.json({ error: "No Stripe customer is connected to this account yet." }, { status: 404 });

  const origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? new URL(request.url).origin;
  const portal = await getStripe().billingPortal.sessions.create({ customer: customerId, return_url: `${origin}/billing` });
  return NextResponse.json({ url: portal.url });
}
