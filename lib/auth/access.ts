import "server-only";
import { currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/auth/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type RunnerRole = "public" | "authenticated" | "subscriber" | "admin";
export type RunnerEntitlement =
  | "none"
  | "free"
  | "active"
  | "manual_access"
  | "trial"
  | "past_due"
  | "canceled"
  | "suspended"
  | "admin";
export type RunnerAccessSource = "stripe" | "admin" | "manual" | "none";

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
};

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

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
  const identityFilters = [`clerk_user_id.eq.${userId}`];
  if (email) identityFilters.push(`email.eq.${email.toLowerCase()}`);

  const { data, error } = await supabase
    .from("manual_access_grants")
    .select("clerk_user_id, email, active, expires_at")
    .eq("active", true)
    .or(identityFilters.join(","));

  if (error || !data) return null;

  const now = Date.now();
  const active = (data as unknown as ManualGrantRow[]).find(
    (grant) => !grant.expires_at || new Date(grant.expires_at).getTime() > now,
  );
  return active ?? null;
}

/**
 * Single source of truth for what a signed-in user is allowed to see.
 * Combines: admin bootstrap allowlist, Clerk role metadata, Stripe-driven
 * subscription metadata (synced by the webhook), and manually granted access
 * (admin-issued comps, recorded in Supabase).
 */
export async function getRunnerAccess(): Promise<RunnerAccess> {
  if (!isClerkConfigured()) return NO_ACCESS;

  const user = await currentUser();
  if (!user) return NO_ACCESS;

  const userId = user.id;
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? null;
  const meta = (user.privateMetadata ?? {}) as Record<string, unknown>;

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
    };
  }

  const subscriptionStatus = typeof meta.subscriptionStatus === "string" ? meta.subscriptionStatus : undefined;
  const runnerPlan = typeof meta.runnerPlan === "string" ? meta.runnerPlan : undefined;
  const stripeActive = Boolean(runnerPlan) && subscriptionStatus !== undefined && ACTIVE_SUBSCRIPTION_STATUSES.has(subscriptionStatus);

  if (stripeActive) {
    return {
      authenticated: true,
      userId,
      email,
      role: "subscriber",
      entitlement: subscriptionStatus === "trialing" ? "trial" : "active",
      source: "stripe",
      expiresAt: null,
      fullAccess: true,
      isAdmin: false,
    };
  }

  const manualGrant = await findActiveManualGrant(userId, email);
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
    };
  }

  return {
    authenticated: true,
    userId,
    email,
    role: "authenticated",
    entitlement: subscriptionStatus === "past_due" || subscriptionStatus === "canceled" ? (subscriptionStatus as RunnerEntitlement) : "free",
    source: runnerPlan ? "stripe" : "none",
    expiresAt: null,
    fullAccess: false,
    isAdmin: false,
  };
}

/** For API routes: returns the caller's access only if they're an admin, otherwise null. */
export async function requireAdminAccess(): Promise<RunnerAccess | null> {
  const access = await getRunnerAccess();
  return access.isAdmin ? access : null;
}
