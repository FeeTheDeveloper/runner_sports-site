import ProductHeading from "@/components/ui/ProductHeading";
import EmptyState from "@/components/ui/EmptyState";
import DataStatusBadge from "@/components/ui/DataStatusBadge";
import { getRunnerAccess } from "@/lib/auth/access";
import Paywall from "@/components/auth/Paywall";

// Systems research (feature register: SYS-*) requires a historical evaluation
// engine with leakage controls and time-separated evaluation. Until that engine
// publishes verified results, this page must not render system records, units,
// ROI, or win rates. Previously this page shipped illustrative rows; those were
// removed under the Intelligence Replacement Directive (docs/replacement/).

// Access is per-request (Clerk); never prerender the paywall decision.
export const dynamic = "force-dynamic";

const columns = ["Rank", "System", "Sport", "Record", "Units", "ROI", "Win %", "Qualifiers"];

export default async function SystemsPage() {
  const access = await getRunnerAccess();
  if (!access.fullAccess) return <Paywall feature="System Finder" />;

  return (
    <div className="space-y-7">
      <ProductHeading
        eyebrow="System Finder"
        title="Find The Pattern"
        description="Discover, validate, and monitor repeatable sports-market situations. Published systems require sample size, backtest period, drawdown, and current qualifiers."
      />

      <div className="data-panel p-5">
        <p className="text-xs font-bold text-text">
          Ask Runner AI to find a system{" "}
          <span className="ml-2 rounded-full border border-dashed border-border px-2 py-0.5 text-[9px] font-black normal-case tracking-normal text-text-muted">
            Coming soon
          </span>
        </p>
        <div className="mt-3 flex gap-2" title="Coming soon">
          <input
            disabled
            className="min-w-0 flex-1 cursor-not-allowed rounded-lg border border-border bg-canvas px-4 py-3 text-sm text-text-subtle outline-none"
            placeholder="NBA home favorites after consecutive road losses"
            aria-label="System query"
          />
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="cursor-not-allowed rounded-lg bg-accent px-5 py-3 text-xs font-black text-white opacity-60"
          >
            RUN TEST
          </button>
        </div>
      </div>

      <section aria-labelledby="systems-results" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="systems-results" className="text-xs font-bold uppercase tracking-widest text-text-muted">
            Published systems
          </h2>
          <DataStatusBadge tone="warning" label="Historical engine not connected" />
        </div>
        <p className="text-xs text-text-muted">
          Result columns when available: {columns.join(" · ")}.
        </p>
        <EmptyState
          title="No verified systems published yet"
          description="System records, units, ROI, and win rates appear only after the historical evaluation engine publishes time-separated, leakage-controlled results. Nothing is shown until then."
        />
      </section>
    </div>
  );
}
