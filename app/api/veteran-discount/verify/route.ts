import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe/server";
import { getVeteranCouponId } from "@/lib/billing/veteranDiscount";

// Callback invoked by Hutchrok Group Solutions once their custom veteran
// verification process completes (target SLA: 24 hours from request). Secured
// with a bearer secret rather than Clerk session auth since the caller is an
// external verification service, not a signed-in Runner user.
const decisionSchema = z.object({
  requestId: z.string().uuid(),
  decision: z.enum(["approved", "denied"]),
  reviewedBy: z.string().trim().max(200).optional(),
  reason: z.string().trim().max(500).optional(),
});

function authorize(request: Request): NextResponse | null {
  const secret = process.env.HUTCHROK_VERIFICATION_SECRET;
  if (!secret) return NextResponse.json({ error: "Veteran verification callback is not configured." }, { status: 503 });

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  return null;
}

export async function POST(request: Request) {
  const unauthorized = authorize(request);
  if (unauthorized) return unauthorized;

  const parsed = decisionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Provide a valid requestId and decision." }, { status: 400 });

  const { requestId, decision, reviewedBy, reason } = parsed.data;
  const supabase = getSupabaseServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from("veteran_discount_requests")
    .select("id, clerk_user_id, status")
    .eq("id", requestId)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Veteran discount request not found." }, { status: 404 });
  const record = existing as unknown as { id: string; clerk_user_id: string; status: string };

  const reviewer = reviewedBy?.trim() || "Hutchrok Group Solutions";
  let couponApplied = false;

  if (decision === "approved") {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(record.clerk_user_id);
    const stripeSubscriptionId = (user.privateMetadata as Record<string, unknown>).stripeSubscriptionId;
    const couponId = getVeteranCouponId();

    if (isStripeConfigured() && couponId && typeof stripeSubscriptionId === "string") {
      await getStripe().subscriptions.update(stripeSubscriptionId, { discounts: [{ coupon: couponId }] });
      couponApplied = true;
    }

    await clerk.users.updateUserMetadata(record.clerk_user_id, {
      privateMetadata: { veteranDiscountStatus: "approved", veteranDiscountVerifiedAt: new Date().toISOString() },
    });
  } else {
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(record.clerk_user_id, {
      privateMetadata: { veteranDiscountStatus: "denied", veteranDiscountVerifiedAt: new Date().toISOString() },
    });
  }

  const { data, error } = await supabase
    .from("veteran_discount_requests")
    .update({
      status: decision,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewer,
      denial_reason: decision === "denied" ? (reason ?? null) : null,
      stripe_coupon_applied: couponApplied,
      updated_at: new Date().toISOString(),
    })
    .eq("id", requestId)
    .select("id, status, reviewed_at, reviewed_by, stripe_coupon_applied")
    .single();

  if (error) return NextResponse.json({ error: "Decision applied but the request record failed to update." }, { status: 500 });
  return NextResponse.json({ request: data });
}
