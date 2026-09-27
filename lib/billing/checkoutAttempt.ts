import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PaidPlanId } from "@/lib/billing/plans";

export interface CheckoutAttempt {
  state: "acquired";
  attempt_id: string;
  lease_token: string;
  plan: PaidPlanId;
  price_id: string;
  stripe_session_id: string | null;
}

export async function beginCheckoutAttempt(owner: string, plan: PaidPlanId, price: string): Promise<CheckoutAttempt | "review_required" | null> {
  const { data, error } = await getSupabaseServerClient().rpc("runner_checkout_begin", { p_owner: owner, p_plan: plan, p_price: price });
  if (error || !data || typeof data !== "object" || Array.isArray(data)) throw new Error("Checkout coordination is unavailable.");
  if (data.state === "busy") return null;
  if (data.state === "review_required") return "review_required";
  if (data.state !== "acquired") throw new Error("Checkout coordination is unavailable.");
  return data as unknown as CheckoutAttempt;
}
export async function rotateCheckoutAttempt(owner: string, attempt: CheckoutAttempt, plan: PaidPlanId, price: string): Promise<CheckoutAttempt> {
  if (!attempt.stripe_session_id) throw new Error("An unknown checkout cannot be replaced.");
  const { data, error } = await getSupabaseServerClient().rpc("runner_checkout_rotate", {
    p_owner: owner, p_lease: attempt.lease_token, p_session: attempt.stripe_session_id, p_plan: plan, p_price: price,
  });
  if (error || !data) throw new Error("Checkout coordination is unavailable.");
  return data as unknown as CheckoutAttempt;
}
export async function finishCheckoutAttempt(owner: string, attempt: CheckoutAttempt, session: string | null = null): Promise<void> {
  const { error } = await getSupabaseServerClient().rpc("runner_checkout_finish", { p_owner: owner, p_lease: attempt.lease_token, p_session: session });
  if (error) throw new Error("Checkout coordination is unavailable.");
}
