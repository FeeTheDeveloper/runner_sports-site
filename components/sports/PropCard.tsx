import type { PlayerProp } from "@/types";
import Badge from "@/components/ui/Badge";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import ProbabilityBar from "@/components/ui/ProbabilityBar";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

export default function PropCard({ prop }: { prop: PlayerProp }) {
  const isOverLean = prop.edge >= 0;

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-text">{prop.player.name}</p>
          <p className="text-xs text-text-muted">
            {prop.player.team} vs {prop.opponent} · {prop.player.position}
          </p>
        </div>
        <Badge variant="accent" label={prop.sport} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-subtle">{prop.market}</p>
          <p className="font-mono text-sm text-text">{prop.line}</p>
        </div>
        <div className="text-right font-mono text-xs">
          <p className={isOverLean ? "text-positive" : "text-text-muted"}>O {formatOdds(prop.overOdds)}</p>
          <p className={!isOverLean ? "text-positive" : "text-text-muted"}>U {formatOdds(prop.underOdds)}</p>
        </div>
      </div>

      <ProbabilityBar
        label={prop.projection !== undefined ? `Runner projection: ${prop.projection}` : "No-vig consensus probability"}
        value={prop.probability}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          Edge <span className={`font-mono ${isOverLean ? "text-positive" : "text-negative"}`}>{formatSignedPercent(prop.edge)}</span>
        </span>
        <span className="text-text-muted">
          Hit rate (L10){" "}
          <span className="font-mono text-text">
            {prop.recentHitRate !== undefined ? formatPercent(prop.recentHitRate, 0) : "—"}
          </span>
        </span>
        <ConfidenceBadge confidence={prop.confidence} compact />
      </div>

      {prop.matchupContext && (
        <p className="text-xs text-text-subtle border-t border-border pt-2">{prop.matchupContext}</p>
      )}
    </div>
  );
}
