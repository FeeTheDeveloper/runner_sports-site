import type { RunnerEdge } from "@/types";
import Badge from "@/components/ui/Badge";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

const riskVariant = {
  low: "success",
  moderate: "warning",
  high: "danger",
} as const;

export default function EdgeCard({ edge }: { edge: RunnerEdge }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-subtle">#{edge.rank}</span>
        <div className="flex items-center gap-2">
          <Badge variant="accent" label={edge.sport} />
          <Badge variant={riskVariant[edge.riskLevel]} label={`${edge.riskLevel} risk`} />
        </div>
      </div>

      <div>
        <p className="text-xs text-text-muted">{edge.event}</p>
        <p className="text-sm font-semibold text-text mt-0.5">{edge.selection}</p>
        <p className="text-xs text-text-subtle">
          {edge.market} · {edge.sportsbook}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-surface-2 p-3 text-center font-mono text-xs">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1">Odds</p>
          <p className="text-text">{edge.odds !== undefined ? formatOdds(edge.odds) : "—"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1">Implied</p>
          <p className="text-text">{formatPercent(edge.impliedProbability)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1">Runner</p>
          <p className="text-accent">{formatPercent(edge.modelProbability)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          Edge <span className="font-mono text-positive">{formatSignedPercent(edge.edge)}</span>
        </span>
        <ConfidenceBadge confidence={edge.confidence} compact />
      </div>
    </div>
  );
}
