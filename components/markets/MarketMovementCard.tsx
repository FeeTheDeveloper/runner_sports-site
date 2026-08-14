import type { MarketMovementSnapshot } from "@/types";
import Badge from "@/components/ui/Badge";
import TrendIndicator from "@/components/ui/TrendIndicator";
import { formatLine, formatOdds, formatTime } from "@/lib/utils/format";

export default function MarketMovementCard({ movement }: { movement: MarketMovementSnapshot }) {
  return (
    <article className="runner-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-text">{movement.event}</p><p className="mt-1 text-xs text-text-muted">{movement.market}</p></div>
        <Badge variant="accent" label={movement.sportsbook} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-lg border border-border bg-surface-2 p-3">
        <div><p className="text-[10px] uppercase tracking-wider text-text-subtle">Opening</p><p className="mt-1 font-mono text-sm text-text">{formatLine(movement.openingLine)} <span className="text-text-muted">{formatOdds(movement.openingPrice)}</span></p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-text-subtle">Current</p><p className="mt-1 font-mono text-sm text-accent">{formatLine(movement.currentLine)} <span className="text-text-muted">{formatOdds(movement.currentPrice)}</span></p></div>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs"><TrendIndicator direction={movement.direction}>{movement.direction === "flat" ? "Price move" : `${movement.direction} move`}</TrendIndicator><span className="text-text-subtle">Demo snapshot · {formatTime(movement.capturedAt)}</span></div>
    </article>
  );
}
