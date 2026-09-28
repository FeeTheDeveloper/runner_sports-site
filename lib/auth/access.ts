import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/auth/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getBillingSubscriptions, isActiveSubscription } from "@/lib/billing/subscriptions";
import { planRank, type PaidPlanId } from "@/lib/billing/plans";
import { isOwnerEmail } from "@/lib/auth/owner";

export type RunnerRole = "public" | "authenticated" | "subscriber" | "admin" | "owner";
export type RunnerEntitlement =
  | "none"
  | "free"
  | "active"
  | "manual_access"
  | "trial"
  | "past_due"
  | "canceled"
  | "suspended"
  | "admin"
  | "owner";
export type RunnerAccessSource = "stripe" | "admin" | "manual" | "owner" | "none";

export interface RunnerAccess {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  role: RunnerRole;
  entitlement: RunnerEntitlement;
  source: RunnerAccessSource;
  expiresAt: string | null;
  fullAccess: boolean;
  isAdmin: boolean;
  /** The single owner account. Implies isAdmin and permanent fullAccess. */
  isOwner: boolean;
  paidPlan: PaidPlanId | null;
  billingState: "not_connected" | "synced" | "unavailable";
}

const NO_ACCESS: RunnerAccess = {
  authenticated: false,
  userId: null,
  email: null,
  role: "public",
  entitlement: "none",
  source: "none",
  expiresAt: null,
  fullAccess: false,
  isAdmin: false,
  isOwner: false,
  paidPlan: null,
  billingState: "not_connected",
};

function adminBootstrapEmails(): string[] {
  return (process.env.RUNNER_ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

interface ManualGrantRow {
  clerk_user_id: string | null;
  email: string;
  active: boolean;
  expires_at: string | null;
}

async function findActiveManualGrant(userId: string, email: string | null): Promise<ManualGrantRow | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("manual_access_grants")
    .select("clerk_user_id, email, active, expires_at")
    .eq("active", true)
    .eq("clerk_user_id", userId);

  if (error || !data) return null;

  const now = Date.now();
  const active = (data as unknown as ManualGrantRow[]).find(
    (grant) => !grant.expires_at || new Date(grant.expires_at).getTime() > now,
  );
  if (active || !email) return active ?? null;

  // An existing identity binding never transfers via a matching email. Use
  // scalar equality parameters, not a filter expression containing email text.
  const { data: emailGrants, error: emailError } = await supabase
    .from("manual_access_grants")
    .select("clerk_user_id, email, active, expires_at")
    .eq("active", true)
    .is("clerk_user_id", null)
    .eq("email", email.toLowerCase());
  if (emailError || !emailGrants) return null;
  return (emailGrants as unknown as ManualGrantRow[]).find(
    (grant) => !grant.expires_at || new Date(grant.expires_at).getTime() > now,
  ) ?? null;
}

/**
 * Single source of truth for what a signed-in user is allowed to see.
 * Combines: admin bootstrap allowlist, Clerk role metadata, Stripe-driven
 * authoritative Supabase subscription mirror, and manually granted access
 * (admin-issued comps, recorded in Supabase).
 */
export async function getRunnerAccess(): Promise<RunnerAccess> {
  if (!isClerkConfigured()) return NO_ACCESS;

  const user = await currentUser();
  if (!user) return NO_ACCESS;

  const userId = user.id;
  const email = user.primaryEmailAddress?.verification?.status === "verified"
    ? user.primaryEmailAddress.emailAddress
    : null;
  const meta = (user.privateMetadata ?? {}) as Record<string, unknown>;

  // The owner outranks every other tier and is checked first, so no billing
  // state, grant expiry or metadata edit can reduce this account's access.
  if (isOwnerEmail(email)) {
    return {
      authenticated: true,
      userId,
      email,
      role: "owner",
      entitlement: "owner",
      source: "owner",
      expiresAt: null,
      fullAccess: true,
      isAdmin: true,
      isOwner: true,
      paidPlan: null,
      billingState: "not_connected",
    };
  }

  const isBootstrapAdmin = email ? adminBootstrapEmails().includes(email.toLowerCase()) : false;
  const isMetaAdmin = meta.role === "admin";

  if (isBootstrapAdmin || isMetaAdmin) {
    return {
      authenticated: true,
      userId,
      email,
      role: "admin",
      entitlement: "admin",
      source: "admin",
      expiresAt: null,
      fullAccess: true,
      isAdmin: true,
      isOwner: false,
      paidPlan: null,
      billingState: "not_connected",
    };
  }

  const billing = await getBillingSubscriptions(userId).then(rows => ({ rows, unavailable: false }))
    .catch(() => ({ rows: [], unavailable: true }));
  const activeSubscription = billing.rows.filter(row => isActiveSubscription(row))
    .sort((a, b) => planRank(b.plan) - planRank(a.plan))[0];
  if (activeSubscription) {
    return {
      authenticated: true,
      userId,
      email,
      role: "subscriber",
      entitlement: activeSubscription.status === "trialing" ? "trial" : "active",
      source: "stripe",
      expiresAt: activeSubscription.period_end,
      fullAccess: true,
      isAdmin: false,
      isOwner: false,
      paidPlan: activeSubscription.plan,
      billingState: "synced",
    };
  }

  const manualGrant = await findActiveManualGrant(userId, email).catch(() => null);
  if (manualGrant) {
    return {
      authenticated: true,
      userId,
      email,
      role: "subscriber",
      entitlement: "manual_access",
      source: "manual",
      expiresAt: manualGrant.expires_at,
      fullAccess: true,
      isAdmin: false,
      isOwner: false,
      paidPlan: null,
      billingState: billing.unavailable ? "unavailable" : "synced",
    };
  }

  return {
    authenticated: true,
    userId,
    email,
    role: "authenticated",
    entitlement: billing.rows.some(row => row.status === "past_due") ? "past_due" : billing.rows.some(row => row.status === "canceled") ? "canceled" : "free",
    source: billing.rows.length ? "stripe" : "none",
    expiresAt: null,
    fullAccess: false,
    isAdmin: false,
    isOwner: false,
    paidPlan: null,
    billingState: billing.unavailable ? "unavailable" : billing.rows.length ? "synced" : "not_connected",
  };
}

/** For API routes: returns the caller's access only if they're an admin, otherwise null. */
export async function requireAdminAccess(): Promise<RunnerAccess | null> {
  const access = await getRunnerAccess();
  return access.isAdmin ? access : null;
}
