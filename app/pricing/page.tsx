import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { getStripePriceId, intervalsFor, PAID_PLANS, priceSpec, type BillingInterval, type PaidPlanId } from "@/lib/billing/plans";
import { MILITARY_DISCOUNT_PERCENT, VETERAN_DISCOUNT_SLA_HOURS, VETERAN_DISCOUNT_VERIFIER, VETERAN_TRIAL_DAYS } from "@/lib/billing/veteranDiscount";
import { isCheckoutEnabled } from "@/lib/stripe/server";

const COPY: Record<PaidPlanId, { marker: string; description: string; features: string[] }> = {
  plus: {
    marker: "Entry access",
    description: "Market consensus research and your private tracker.",
    features: ["Market consensus research", "Matchup and prop research", "Your private bet tracker"],
  },
  pro: {
    marker: "Most popular",
    description: "Everything in Plus, with the full research surface and edge board.",
    features: ["Everything in Plus", "Edge board and signals", "Full research surface"],
  },
  premium: {
    marker: "Annual only",
    description: "Everything in Pro, billed once a year.",
    features: ["Everything in Pro", "Annual billing only", "Priority support"],
  },
  premium_plus: {
    marker: "Lifetime — one payment",
    description: "One payment, no renewal. Advanced model runs are not available yet.",
    features: ["Everything in Premium", "One payment, no renewal", "Advanced model runs not yet available"],
  },
};

const INTERVAL_NOTE: Record<BillingInterval, string> = {
  monthly: "billed monthly",
  yearly: "billed annually",
  lifetime: "one-time payment",
};

export default function PricingPage() {
  const checkoutOn = isCheckoutEnabled();
  const planIds = (Object.keys(PAID_PLANS) as PaidPlanId[]).sort((a, b) => PAID_PLANS[a].rank - PAID_PLANS[b].rank);

  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 lg:px-10">
      <nav className="mx-auto flex max-w-[1300px] items-center justify-between">
        <Link href="/"><RunnerLogo /></Link>
        <div className="flex items-center gap-3"><Link href="/sign-in" className="text-xs font-black uppercase tracking-wider text-text-muted">Sign in</Link><Link href="/sign-up" className="rounded-lg bg-accent px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white">Create account</Link></div>
      </nav>
      <section className="mx-auto max-w-[1300px] py-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[.28em] text-accent">Runner Access</p>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-[-.05em] text-white sm:text-7xl">Own the information.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-muted">Compare Runner access levels. The exact amount, billing interval and first charge date are confirmed in secure checkout before you pay. Prediction models are not currently available.</p>
        <p className="mx-auto mt-3 max-w-2xl text-xs font-black uppercase tracking-wider text-analytics">
          Military and veterans save {MILITARY_DISCOUNT_PERCENT}%, plus a {VETERAN_TRIAL_DAYS}-day free trial after verification — handled by {VETERAN_DISCOUNT_VERIFIER}, typically within {VETERAN_DISCOUNT_SLA_HOURS} hours. Request it from your billing page after signing up.
        </p>

        <div className="mt-12 grid gap-4 text-left md:grid-cols-2 xl:grid-cols-4">
          {planIds.map((id) => {
            const plan = PAID_PLANS[id];
            const copy = COPY[id];
            const intervals = intervalsFor(id);
            const headline = priceSpec(id, intervals[0]);
            return (
              <article key={id} className={`rounded-2xl border p-7 ${id === "pro" ? "border-accent bg-surface shadow-[0_0_60px_rgba(229,18,43,.12)]" : "border-white/10 bg-[#070d20]"}`}>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-analytics">{copy.marker}</p>
                <h2 className="mt-3 text-3xl font-black uppercase text-white">{plan.name}</h2>
                <p className="mt-3 text-2xl font-black text-white">{headline?.label}</p>
                <p className="mt-4 min-h-20 text-sm leading-6 text-text-muted">{copy.description}</p>
                <ul className="my-7 space-y-3 border-y border-white/10 py-6 text-sm text-text">
                  {copy.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-positive">✓</span>{feature}</li>)}
                </ul>
                <div className="space-y-2">
                  {intervals.map((interval) => {
                    const spec = priceSpec(id, interval);
                    if (!spec) return null;
                    const enabled = checkoutOn && Boolean(getStripePriceId(id, interval));
                    return (
                      <div key={interval}>
                        <CheckoutButton plan={id} interval={interval} enabled={enabled} label={spec.label} />
                        <p className="mt-1 text-center text-[10px] uppercase tracking-wider text-text-muted">{INTERVAL_NOTE[interval]}</p>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-xs leading-5 text-text-muted">
          Runner Scout remains free — browse the public board, delayed odds comparison and research previews without an account upgrade.{" "}
          <Link href="/sign-up" className="font-black text-white underline">Start scouting</Link>.
        </p>
      </section>
    </main>
  );
}
