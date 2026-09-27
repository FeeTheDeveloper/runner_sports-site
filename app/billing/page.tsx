import Link from "next/link";
import PortalButton from "@/components/billing/PortalButton";
import VeteranDiscountPanel from "@/components/billing/VeteranDiscountPanel";
import ProductHeading from "@/components/ui/ProductHeading";
import { getRunnerAccess } from "@/lib/auth/access";
import { getBillingCustomer } from "@/lib/billing/subscriptions";
import { PAID_PLANS } from "@/lib/billing/plans";
import { isStripeBillingConfigured } from "@/lib/stripe/server";

export default async function BillingPage() {
  const access = await getRunnerAccess();
  const plan = access.paidPlan ? PAID_PLANS[access.paidPlan].name : "No active paid plan";
  const statusLabels = { none: "Not signed in", free: "Free access", active: "Active", manual_access: "Complimentary access", trial: "Trial", past_due: "Payment needed", canceled: "Canceled", suspended: "Suspended", admin: "Administrator" };
  const status = access.billingState === "unavailable" ? "Billing temporarily unavailable" : statusLabels[access.entitlement];
  const hasCustomer = access.userId ? Boolean(await getBillingCustomer(access.userId).catch(() => null)) : false;

  return (
    <div className="space-y-7">
      <ProductHeading eyebrow="Runner Access" title="Billing" description="Subscription status and secure Stripe self-service." />
      <section className="data-panel p-6">
        <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Access level</p><p className="mt-2 text-xl font-black uppercase text-text">{plan}</p></div><div><p className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Status</p><p className="mt-2 text-xl font-black uppercase text-text">{status}</p></div></div>
        <div className="mt-7 flex flex-wrap gap-3">{access.authenticated && isStripeBillingConfigured() && hasCustomer ? <PortalButton /> : null}<Link href="/pricing" className="rounded-lg border border-border px-4 py-3 text-xs font-black uppercase text-text">View access levels</Link></div>
        {!isStripeBillingConfigured() ? <p className="mt-5 text-xs text-text-muted">Checkout is temporarily unavailable. Please try again later.</p> : null}
        {access.expiresAt ? <p className="mt-4 text-sm text-text-muted">Current access period ends {new Date(access.expiresAt).toLocaleDateString("en-US")}.</p> : null}
        <div className="mt-6 border-t border-border pt-5 text-sm text-text-muted"><p>Research access: {access.fullAccess ? "Enabled" : "Not active"}</p><p className="mt-2">Prediction model runs are not available yet.</p><p className="mt-2">Model usage allowances will be shown here when the service becomes available.</p></div>
      </section>
      {access.authenticated ? <VeteranDiscountPanel /> : null}
    </div>
  );
}
