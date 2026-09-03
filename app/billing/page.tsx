import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import PortalButton from "@/components/billing/PortalButton";
import ProductHeading from "@/components/ui/ProductHeading";
import { isClerkConfigured } from "@/lib/auth/config";
import { isStripeConfigured } from "@/lib/stripe/server";

export default async function BillingPage() {
  const user = isClerkConfigured() ? await currentUser() : null;
  const metadata = (user?.privateMetadata ?? {}) as Record<string, unknown>;
  const plan = typeof metadata.runnerPlan === "string" ? metadata.runnerPlan : "No paid plan";
  const status = typeof metadata.subscriptionStatus === "string" ? metadata.subscriptionStatus : "inactive";
  const hasCustomer = typeof metadata.stripeCustomerId === "string";

  return (
    <div className="space-y-7">
      <ProductHeading eyebrow="Runner Access" title="Billing" description="Subscription status and secure Stripe self-service." />
      <section className="data-panel p-6">
        <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Access level</p><p className="mt-2 text-xl font-black uppercase text-text">{plan}</p></div><div><p className="text-[10px] font-black uppercase tracking-wider text-text-subtle">Status</p><p className="mt-2 text-xl font-black uppercase text-text">{status}</p></div></div>
        <div className="mt-7 flex flex-wrap gap-3">{user && isStripeConfigured() && hasCustomer ? <PortalButton /> : null}<Link href="/pricing" className="rounded-lg border border-border px-4 py-3 text-xs font-black uppercase text-text">View access levels</Link></div>
        {!isStripeConfigured() ? <p className="mt-5 text-xs text-text-muted">Stripe is not active in this environment yet. The billing paths are ready for the deployment keys.</p> : null}
      </section>
    </div>
  );
}
