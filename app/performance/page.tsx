import { redirect } from "next/navigation";
import ProductHeading from "@/components/ui/ProductHeading";
import { RunnerPerformanceCard } from "@/components/scoreboard/RunnerPerformanceCard";
import ImportPanel from "@/components/performance/ImportPanel";
import PerformanceBreakdownTable from "@/components/performance/PerformanceBreakdownTable";
import { getRunnerAccess } from "@/lib/auth/access";
import { getPerformanceSummary } from "@/lib/data/performance";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const access = await getRunnerAccess();
  if (!access.authenticated) redirect("/sign-in");
  if (!access.isAdmin) redirect("/account");

  const summary = await getPerformanceSummary().catch(() => null);

  return (
    <div className="space-y-8">
      <ProductHeading
        eyebrow="Runner Admin"
        title="Performance Ledger"
        description="Verified historical betting performance imported from Juice Reel. Ticket risk and P/L are real settled records, never a model projection."
      />

      <ImportPanel />

      {!summary ? (
        <section className="data-panel p-6">
          <p className="text-sm text-text-muted">No performance data yet &mdash; import a Juice Reel CSV export above to get started.</p>
        </section>
      ) : (
        <>
          <RunnerPerformanceCard
            title="Runner Verified Performance"
            totalBets={summary.totalBets}
            netProfit={summary.netProfit}
            roi={summary.roiPercent}
            wins={summary.wins}
            losses={summary.losses}
            cashouts={summary.cashouts}
            source="Juice Reel Synced Ledger"
            verifiedAt={summary.generatedAt}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <PerformanceBreakdownTable title="By Sportsbook" buckets={summary.bySportsbook} />
            <PerformanceBreakdownTable title="By Leg Count" buckets={summary.byLegCount} />
            <PerformanceBreakdownTable title="By Sport (exploratory)" buckets={summary.bySport} />
            <PerformanceBreakdownTable title="By League (exploratory)" buckets={summary.byLeague} />
            <PerformanceBreakdownTable title="By Market Type (exploratory)" buckets={summary.byMarketType} />
            <PerformanceBreakdownTable title="By Duration (exploratory)" buckets={summary.byDuration} />
          </div>
        </>
      )}
    </div>
  );
}
