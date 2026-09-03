import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";
import CheckoutButton from "@/components/billing/CheckoutButton";
import { getStripePriceId } from "@/lib/billing/plans";

const plans = [
  {
    id: "free",
    name: "Runner Scout",
    marker: "Open board",
    description: "Live board access and a clear view of how Runner separates facts, market pricing and model signals.",
    features: ["Live event board", "Public odds comparison", "Research previews"],
  },
  {
    id: "pro",
    name: "Runner Pro",
    marker: "Price set in Stripe",
    description: "The full daily decision surface for people who need deeper market and matchup intelligence.",
    features: ["Best plays of the day", "Full model breakdowns", "Saved research and alerts"],
  },
  {
    id: "command",
    name: "Runner Command",
    marker: "Price set in Stripe",
    description: "Leadership-level access to advanced systems, model comparisons and priority intelligence releases.",
    features: ["Everything in Pro", "Advanced systems and backtests", "Priority model releases"],
  },
] as const;

export default function PricingPage() {
  return (
    <main className="min-h-dvh bg-canvas px-5 py-8 lg:px-10">
      <nav className="mx-auto flex max-w-[1300px] items-center justify-between">
        <Link href="/"><RunnerLogo /></Link>
        <div className="flex items-center gap-3"><Link href="/sign-in" className="text-xs font-black uppercase tracking-wider text-text-muted">Sign in</Link><Link href="/sign-up" className="rounded-lg bg-accent px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white">Create account</Link></div>
      </nav>
      <section className="mx-auto max-w-[1300px] py-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[.28em] text-accent">Runner Access</p>
        <h1 className="mt-4 text-5xl font-black uppercase tracking-[-.05em] text-white sm:text-7xl">Own the information.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-text-muted">This is access to the Runner intelligence platform—not a picks club. Final paid prices are controlled in Stripe so the site can launch without hard-coded billing assumptions.</p>
        <div className="mt-12 grid gap-4 text-left lg:grid-cols-3">
          {plans.map((plan, index) => {
            const isPaid = plan.id !== "free";
            const enabled = isPaid && Boolean(getStripePriceId(plan.id));
            return (
              <article key={plan.id} className={`rounded-2xl border p-7 ${index === 1 ? "border-accent bg-surface shadow-[0_0_60px_rgba(229,18,43,.12)]" : "border-white/10 bg-[#070d20]"}`}>
                <p className="text-[10px] font-black uppercase tracking-[.22em] text-analytics">{plan.marker}</p>
                <h2 className="mt-3 text-3xl font-black uppercase text-white">{plan.name}</h2>
                <p className="mt-4 min-h-24 text-sm leading-6 text-text-muted">{plan.description}</p>
                <ul className="my-7 space-y-3 border-y border-white/10 py-6 text-sm text-text">
                  {plan.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-positive">✓</span>{feature}</li>)}
                </ul>
                {isPaid ? <CheckoutButton plan={plan.id} enabled={enabled} /> : <Link href="/sign-up" className="block w-full rounded-lg border border-white/15 px-4 py-3 text-center text-xs font-black uppercase tracking-wider text-white">Start scouting</Link>}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
