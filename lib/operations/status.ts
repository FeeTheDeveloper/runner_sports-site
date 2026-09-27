import "server-only";
import { getRunnerAccess } from "@/lib/auth/access";
import { getClerkConfigurationState } from "@/lib/auth/config";
import { getSupabaseEnv } from "@/lib/env";
import { isStripeBillingConfigured } from "@/lib/stripe/server";
import { queryRunnerTable, validRunnerTimestamp, type RunnerRow } from "@/lib/data/runner";

const RUNNER_PROJECT = "vrhvvywncclonfwplsjl";

export class OperationsAccessError extends Error {
  constructor(readonly status: 401 | 403) { super("Operations access denied"); }
}

export interface ConnectionCheck {
  id: string;
  name: string;
  configured: boolean;
  requirements: Array<{ label: string; present: boolean }>;
  note: string;
  href: string;
}

export interface OperationReceipt {
  name: string;
  status: string;
  receivedAt: string | null;
  freshness: "RECENT" | "STALE" | "UNVERIFIED";
}

export interface ReceiptSection {
  state: "available" | "empty" | "unavailable" | "not_configured" | "target_mismatch";
  items: OperationReceipt[];
}

// These are dated audit receipts, not continuously verified connection claims.
export const CONNECTION_AUDIT = {
  checkedOn: "2026-09-26",
  method: "Provider dashboard inspection during the production readiness audit",
  entries: [
    { provider: "Clerk", finding: "The inspected Runner application exposed a development instance. Local production-key binding to that application was not verified.", next: "Confirm the intended production application and domain before release.", state: "Application binding unresolved" },
    { provider: "Supabase", finding: "Runner project vrhvvywncclonfwplsjl was healthy under Fee The Developer LLC. The local project URL differed from that verified target.", next: "Reconcile the intended project, then verify approved migrations and access tests.", state: "Local target mismatch at audit" },
    { provider: "Vercel", finding: "The accessible team listed runner-dashboard-site, connected to a different repository. Import search confirmed FeeTheDeveloper/runner_sports-site is available, but no Site deployment was created.", next: "Create the Site project from the reviewed release revision after approval.", state: "Deployment pending" },
    { provider: "Stripe", finding: "The latest inspected environment was the Fee The Developer LLC sandbox. An earlier live Found App account was not confirmed as the Runner merchant.", next: "Confirm the live merchant, products and webhook destination before enabling payments.", state: "Merchant confirmation pending" },
  ],
} as const;

export const MAINTENANCE_GATES = [
  { title: "Confirm the deployment destination", detail: "Match the Site repository, deployment project and domain before publishing a build.", owner: "King Fee + engineering" },
  { title: "Validate access and subscriptions", detail: "Verify production sign-in, two-user tracker isolation, subscription webhooks and the approved database migrations.", owner: "Engineering" },
  { title: "Check intelligence receipts", detail: "Review engine heartbeat and provider timestamps. Stale data and missing models must remain labeled unavailable.", owner: "Runner operator" },
  { title: "Rehearse recovery", detail: "Create a verified Demon backup and test restore in an isolated workspace before release or a storage change.", owner: "Engineering" },
  { title: "Review every release", detail: "Run tests, lint, build and dependency audit; retain release evidence and obtain authorization for external changes.", owner: "Engineering + King Fee" },
] as const;

function configuration(): { connections: ConnectionCheck[]; receiptTarget: "ready" | "not_configured" | "target_mismatch" } {
  const present = (key: string) => Boolean(process.env[key]?.trim());
  const connection = (id: string, name: string, requirements: Array<[string, string]>, note: string, href: string): ConnectionCheck => ({
    id, name, requirements: requirements.map(([label, key]) => ({ label, present: present(key) })),
    configured: requirements.every(([, key]) => present(key)), note, href,
  });
  const connections = [
    connection("identity", "Identity", [["Publishable key", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"], ["Server credential", "CLERK_SECRET_KEY"], ["Approved instance binding", "CLERK_EXPECTED_FRONTEND_API"]], "Presence does not establish a production Clerk instance.", "https://dashboard.clerk.com/"),
    connection("database", "Data plane", [["Project URL", "SUPABASE_URL"], ["Server credential", "SUPABASE_SERVICE_ROLE_KEY"], ["Approved project binding", "SUPABASE_EXPECTED_PROJECT_REF"]], "Receipts are read only from the verified Runner project.", `https://supabase.com/dashboard/project/${RUNNER_PROJECT}`),
    connection("billing", "Subscriptions", [["Server credential", "STRIPE_SECRET_KEY"], ["Webhook signing", "STRIPE_WEBHOOK_SECRET"], ["Plus monthly price", "STRIPE_PRICE_RUNNER_PLUS_MONTHLY"], ["Plus yearly price", "STRIPE_PRICE_RUNNER_PLUS_YEARLY"], ["Pro monthly price", "STRIPE_PRICE_RUNNER_PRO_MONTHLY"], ["Pro yearly price", "STRIPE_PRICE_RUNNER_PRO_YEARLY"], ["Premium yearly price", "STRIPE_PRICE_RUNNER_PREMIUM_YEARLY"], ["Premium Plus lifetime price", "STRIPE_PRICE_RUNNER_PREMIUM_PLUS_LIFETIME"], ["Military coupon", "STRIPE_COUPON_MILITARY20"], ["Merchant binding", "STRIPE_EXPECTED_ACCOUNT_ID"], ["Billing mode", "STRIPE_BILLING_MODE"]], "Configured prices do not confirm the merchant or payment readiness.", "https://dashboard.stripe.com/"),
    connection("feeds", "Scheduled feeds", [["Odds credential", "ODDS_API_KEY"], ["Schedule authorization", "CRON_SECRET"]], "Check execution receipts in the deployment dashboard; configuration does not prove a job ran.", "https://vercel.com/dashboard"),
    connection("engine", "Demon connection", [["Engine address", "RUNNER_DEMON_API_URL"]], "An address alone does not establish reachability. This screen reads saved receipts, not the private engine endpoint.", "/dashboard"),
  ];
  const identityState = getClerkConfigurationState();
  const identityNotes = {
    missing: "Identity keys are missing in this environment.",
    unverified_instance: "The approved Clerk instance binding has not been configured.",
    invalid_keys: "Identity keys failed format validation; review the server configuration.",
    instance_mismatch: "The configured Clerk instance differs from the approved binding.",
    mode_mismatch: "Clerk test and live key modes do not match.",
    configured: "Key format and instance binding match. Production sign-in acceptance is a separate release gate.",
  };
  connections[0].configured = identityState === "configured";
  connections[0].note = identityNotes[identityState];
  const billingKeyMode = /^(?:sk|rk)_(test|live)_/.exec(process.env.STRIPE_SECRET_KEY ?? "")?.[1];
  const billingModeMatches = billingKeyMode !== undefined && billingKeyMode === process.env.STRIPE_BILLING_MODE;
  connections[2].configured = connections[2].configured && isStripeBillingConfigured() && billingModeMatches;
  if (!billingModeMatches && present("STRIPE_SECRET_KEY") && present("STRIPE_BILLING_MODE")) {
    connections[2].note = "Stripe credential mode does not match the configured billing mode. Review the binding before using payments.";
  }
  let receiptTarget: "ready" | "not_configured" | "target_mismatch" = connections[1].configured ? "target_mismatch" : "not_configured";
  if (connections[1].configured) {
    try {
      getSupabaseEnv();
      const url = new URL(process.env.SUPABASE_URL!);
      if (process.env.SUPABASE_EXPECTED_PROJECT_REF?.trim() === RUNNER_PROJECT && url.origin === `https://${RUNNER_PROJECT}.supabase.co` && !url.username && !url.password && !url.search && !url.hash && url.pathname === "/") receiptTarget = "ready";
    } catch { /* Invalid configured targets stay unavailable; never echo their values. */ }
  }
  connections[1].configured = receiptTarget === "ready";
  if (receiptTarget === "target_mismatch") connections[1].note = "The configured project and approved Runner binding do not match. Receipt reads are blocked.";
  return { connections, receiptTarget };
}

function receipt(row: RunnerRow, kind: "engine" | "provider", now: number): OperationReceipt {
  const providers: Record<string, string> = { kalshi: "Kalshi", polymarket: "Polymarket", odds_api: "Odds API", espn: "ESPN" };
  const statuses = new Set(["RUNNING", "STOPPED", "DEGRADED", "CONNECTED", "DISCONNECTED", "ERROR", "OFFLINE"]);
  const rawStatus = typeof row.status === "string" ? row.status.toUpperCase() : "UNKNOWN";
  const timestamp = kind === "engine" ? row.heartbeat_at : row.last_success_at;
  const epoch = validRunnerTimestamp(timestamp, now);
  const age = epoch === null ? NaN : now - epoch;
  return {
    name: kind === "engine" ? "Runner Demon" : (typeof row.provider === "string" ? providers[row.provider] : undefined) ?? "Other provider",
    status: statuses.has(rawStatus) ? rawStatus : "UNKNOWN",
    receivedAt: epoch !== null ? new Date(epoch).toISOString() : null,
    freshness: !Number.isFinite(age) || age < 0 ? "UNVERIFIED" : age <= 5 * 60_000 ? "RECENT" : "STALE",
  };
}

export async function getAdminOperations() {
  const access = await getRunnerAccess();
  if (!access.authenticated) throw new OperationsAccessError(401);
  if (!access.isAdmin) throw new OperationsAccessError(403);
  const { connections, receiptTarget } = configuration();
  const read = async (table: string, kind: "engine" | "provider", limit: number): Promise<ReceiptSection> => {
    if (receiptTarget !== "ready") return { state: receiptTarget, items: [] };
    try {
      const rows = await queryRunnerTable(table, { limit });
      const items = rows.filter(row => kind !== "engine" || row.id === "runner-sports-demon").map(row => receipt(row, kind, Date.now()));
      return { state: items.length ? "available" : "empty", items };
    } catch {
      return { state: "unavailable", items: [] };
    }
  };
  const [engine, providers] = await Promise.all([read("runner_engine_status", "engine", 10), read("runner_provider_status", "provider", 25)]);
  return { checkedAt: new Date().toISOString(), connections, engine, providers, audit: CONNECTION_AUDIT, maintenance: MAINTENANCE_GATES };
}
