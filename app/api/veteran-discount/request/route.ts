import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/auth/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { VETERAN_DISCOUNT_SLA_HOURS } from "@/lib/billing/veteranDiscount";

interface VeteranDiscountRow {
  id: string;
  status: "pending" | "approved" | "denied";
  requested_at: string;
  review_due_at: string;
  reviewed_at: string | null;
  denial_reason: string | null;
}

async function latestRequest(clerkUserId: string): Promise<VeteranDiscountRow | null> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase
    .from("veteran_discount_requests")
    .select("id, status, requested_at, review_due_at, reviewed_at, denial_reason")
    .eq("clerk_user_id", clerkUserId)
    .order("requested_at", { ascending: false })
    .limit(1);

  return ((data as unknown as VeteranDiscountRow[]) ?? [])[0] ?? null;
}

export async function GET() {
  if (!isClerkConfigured()) return NextResponse.json({ request: null });

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in to check veteran discount status." }, { status: 401 });

  return NextResponse.json({ request: await latestRequest(userId) });
}

export async function POST() {
  if (!isClerkConfigured()) {
    return NextResponse.json({ error: "Sign-in must be configured before requesting verification." }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Sign in before requesting veteran verification." }, { status: 401 });

  const existing = await latestRequest(userId);
  if (existing && existing.status !== "denied") {
    return NextResponse.json({ request: existing, slaHours: VETERAN_DISCOUNT_SLA_HOURS });
  }

  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;
  if (!email) return NextResponse.json({ error: "A verified email is required to request veteran verification." }, { status: 400 });

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("veteran_discount_requests")
    .insert({ clerk_user_id: userId, email: email.toLowerCase(), status: "pending" })
    .select("id, status, requested_at, review_due_at, reviewed_at, denial_reason")
    .single();

  if (error || !data) return NextResponse.json({ error: "Could not submit veteran verification request." }, { status: 500 });

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    privateMetadata: { veteranDiscountStatus: "pending", veteranDiscountRequestedAt: new Date().toISOString() },
  });

  return NextResponse.json({ request: data as unknown as VeteranDiscountRow, slaHours: VETERAN_DISCOUNT_SLA_HOURS }, { status: 201 });
}
