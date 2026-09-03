import type { PredictionMarketSnapshot } from "@/lib/providers/predictionMarkets";
import Badge from "@/components/ui/Badge";

function percent(value?: number) {
  return value === undefined ? "—" : `${(value * 100).toFixed(1)}%`;
}

function money(value?: number) {
  if (value === undefined) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function PredictionMarketCard({ market }: { market: PredictionMarketSnapshot }) {
  return (
    <article className="rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <Badge label={market.provider === "kalshi" ? "KALSHI" : "POLYMARKET"} variant="accent" />
        <span className="text-xs text-text-subtle">{market.status.toUpperCase()}</span>
      </div>
      <h2 className="mt-4 line-clamp-3 min-h-[3.75rem] text-sm font-semibold leading-5 text-text">{market.title}</h2>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4">
        <div><p className="text-[10px] uppercase tracking-wider text-text-subtle">Probability</p><p className="mt-1 text-lg font-semibold text-accent">{percent(market.impliedProbability)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-text-subtle">Liquidity</p><p className="mt-1 text-sm font-semibold text-text">{money(market.liquidity)}</p></div>
        <div><p className="text-[10px] uppercase tracking-wider text-text-subtle">Volume</p><p className="mt-1 text-sm font-semibold text-text">{money(market.volume)}</p></div>
      </div>
      <p className="mt-4 text-[11px] text-text-subtle">Source update {new Date(market.sourceTimestamp).toLocaleString("en-US", { timeZone: "America/Chicago" })} CT</p>
    </article>
  );
}
