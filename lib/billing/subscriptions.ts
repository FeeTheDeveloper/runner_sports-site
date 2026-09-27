import "server-only";
import type Stripe from "stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isPaidPlan, planForStripePrice, type PaidPlanId } from "@/lib/billing/plans";

export interface BillingSubscription {
  stripe_subscription_id: string;
  stripe_customer_id: string;
  owner_user_id: string;
  plan: PaidPlanId | null;
  status: string;
  period_end: string | null;
}

export function isActiveSubscription(row: BillingSubscription, now = Date.now()): boolean {
  return isPaidPlan(row.plan) && (row.status === "active" || row.status === "trialing") &&
    row.period_end !== null && Date.parse(row.period_end) > now;
}

export async function getBillingSubscriptions(userId: string): Promise<BillingSubscription[]> {
  if (!userId) throw new Error("Billing identity is required.");
  const account = process.env.STRIPE_EXPECTED_ACCOUNT_ID;
  const mode = process.env.STRIPE_BILLING_MODE;
  if (!account || !["test", "live"].includes(mode ?? "")) throw new Error("Billing merchant binding is not configured.");
  const { data, error } = await getSupabaseServerClient().from("runner_billing_subscriptions")
    .select("stripe_subscription_id, stripe_customer_id, owner_user_id, plan, status, period_end")
    .eq("owner_user_id", userId).eq("merchant_account_id", account).eq("livemode", mode === "live");
  if (error) throw new Error("Billing synchronization is unavailable.");
  return (data ?? []) as unknown as BillingSubscription[];
}

export async function getBillingCustomer(userId: string): Promise<string | null> {
  const { data, error } = await getSupabaseServerClient().from("runner_billing_customers")
    .select("stripe_customer_id, merchant_account_id").eq("owner_user_id", userId).maybeSingle();
  if (error) throw new Error("Billing connection is unavailable.");
  if (data && data.merchant_account_id !== process.env.STRIPE_EXPECTED_ACCOUNT_ID) throw new Error("Billing merchant binding does not match.");
  return typeof data?.stripe_customer_id === "string" ? data.stripe_customer_id : null;
}

export async function bindBillingCustomer(userId: string, customerId: string): Promise<void> {
  const account = process.env.STRIPE_EXPECTED_ACCOUNT_ID;
  if (!account) throw new Error("Billing merchant binding is not configured.");
  const { error } = await getSupabaseServerClient().rpc("runner_bind_billing_customer", { p_owner: userId, p_customer: customerId, p_account: account });
  if (error) throw new Error("Billing identity binding could not be saved.");
}

export function subscriptionSnapshot(subscription: Stripe.Subscription) {
  const item = subscription.items.data.length === 1 ? subscription.items.data[0] : undefined;
  const resolved = item && item.quantity === 1 && item.price.recurring ? planForStripePrice(item.price.id) : null;
  const plan = resolved?.plan ?? null;
  return {
    plan,
    status: subscription.status,
    periodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000).toISOString() : null,
    customerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
  };
}

export async function reconcileSubscriptionEvent(event: Stripe.Event, subscription: Stripe.Subscription, observedAt: string) {
  const snapshot = subscriptionSnapshot(subscription);
  const { data, error } = await getSupabaseServerClient().rpc("runner_apply_subscription_event", {
    p_event_id: event.id, p_event_type: event.type, p_event_created: event.created,
    p_customer: snapshot.customerId, p_subscription: subscription.id,
    p_status: snapshot.status, p_plan: snapshot.plan, p_period_end: snapshot.periodEnd,
    p_observed_at: observedAt, p_livemode: subscription.livemode,
    p_account: process.env.STRIPE_EXPECTED_ACCOUNT_ID ?? "",
  });
  if (error) throw new Error("Billing synchronization could not be saved.");
  return data;
}

export async function billingObservationTime(): Promise<string> {
  const { data, error } = await getSupabaseServerClient().rpc("runner_billing_observation_time", {});
  if (error || typeof data !== "string" || !Number.isFinite(Date.parse(data))) throw new Error("Billing observation clock is unavailable.");
  return data;
}
