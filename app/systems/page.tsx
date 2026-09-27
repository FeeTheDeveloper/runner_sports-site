import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import { getRunnerAccess } from "@/lib/auth/access";
import Paywall from "@/components/auth/Paywall";

export default async function SystemsPage() {
  const access = await getRunnerAccess();
  if (!access.fullAccess) return <Paywall feature="System Finder" />;
  return (
    <div className="space-y-7">
      <ProductHeading eyebrow="System Finder" title="Find The Pattern" description="Research repeatable sports-market situations using versioned rules and verified historical outcomes." />
      <section className="data-panel p-8" aria-labelledby="systems-status">
        <p className="text-xs font-bold uppercase tracking-widest text-text-subtle">Engine unavailable</p>
        <h2 id="systems-status" className="mt-3 text-xl font-bold text-text">No verified systems are published</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">The historical Systems Engine is not connected. Records, returns, win rates, backtests, and current qualifiers are unavailable. This page will display results when the Demon publishes verified system versions and their supporting evidence.</p>
        <Link href="/research" className="mt-6 inline-block rounded-lg border border-border px-4 py-2 text-sm font-semibold text-text">Open research</Link>
      </section>
    </div>
  );
}
