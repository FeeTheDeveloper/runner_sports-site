import type { TrackedBet, TrackerSummary } from "@/types";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency, formatPercent } from "@/lib/utils/format";

const RESULT_VARIANT = {
  win: "success",
  loss: "danger",
  push: "default",
  pending: "warning",
} as const;

export default function FinalResultsAccountability({
  summary,
  recentBets,
}: {
  summary: TrackerSummary;
  recentBets: TrackedBet[];
}) {
  if (summary.totalWagers === 0) {
    return (
      <EmptyState
        title="No tracked results yet"
        description="Final results populate here from the Runner tracker (tracked_bets in Supabase) as picks settle."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Record" value={`${summary.wins}-${summary.losses}-${summary.pushes}`} />
        <SummaryStat label="Win rate" value={formatPercent(summary.winRate, 0)} />
        <SummaryStat label="Units" value={`${summary.unitsWonLost >= 0 ? "+" : ""}${summary.unitsWonLost}`} highlight={summary.unitsWonLost >= 0} />
        <SummaryStat label="ROI" value={formatPercent(summary.roi)} highlight={summary.roi >= 0} />
      </div>
      {recentBets.length > 0 && (
        <ul className="data-panel divide-y divide-border">
          {recentBets.slice(0, 8).map((bet) => (
            <li key={bet.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5 text-sm">
              <div className="min-w-0">
                <p className="truncate font-semibold text-text">{bet.selection}</p>
                <p className="truncate text-xs text-text-muted">{bet.event} · {bet.market}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-text-muted">{formatCurrency(bet.profit)}</span>
                <Badge variant={RESULT_VARIANT[bet.result]} label={bet.result.toUpperCase()} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SummaryStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wider text-text-subtle">{label}</p>
      <p className={`mt-1 font-mono text-lg font-black ${highlight ? "text-positive" : "text-text"}`}>{value}</p>
    </div>
  );
}
