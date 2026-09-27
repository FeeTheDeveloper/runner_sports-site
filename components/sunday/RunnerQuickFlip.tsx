import type { RunnerEdge } from "@/types";
import Badge from "@/components/ui/Badge";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

export default function RunnerQuickFlip({ edges }: { edges: RunnerEdge[] }) {
  const display = edges[0];
  if (!display) return <div className="leader-card blue-glow"><p className="text-sm text-text-muted">No fresh qualifying NFL price comparison is available. Independent predictions and executable prices are unavailable.</p></div>;

  return (
    <div className="leader-card blue-glow">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[.2em] text-analytics">⚡ Quick Flip</span>
        <Badge variant="default" label={`${display.bookCount ?? "—"} BOOKS`} />
      </div>
      <div className="mt-6">
        <p className="text-xs font-black uppercase tracking-wider text-analytics">{display.league} · {display.market}</p>
        <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">{display.selection}</h3>
        <p className="mt-2 text-sm text-text-muted">{display.event}{display.odds !== undefined ? ` · ${formatOdds(display.odds)}` : ""}</p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <FlipMetric label="No-vig consensus" value={formatPercent(display.noVigConsensusProbability)} />
        <FlipMetric label="Market" value={formatPercent(display.impliedProbability)} />
        <FlipMetric label="Price gap" value={formatSignedPercent(display.edge)} highlight />
      </div>
      <p className="mt-4 text-xs text-text-subtle">Delayed quotes · Execution unverified · Risk unassessed</p>
    </div>
  );
}

function FlipMetric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-text-subtle">{label}</p>
      <p className={`mt-1 font-mono text-lg font-black ${highlight ? "text-positive" : "text-white"}`}>{value}</p>
    </div>
  );
}
