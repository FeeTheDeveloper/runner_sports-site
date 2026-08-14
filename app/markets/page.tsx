import { getMarketMovements } from "@/lib/data/markets";
import MarketMovementCard from "@/components/markets/MarketMovementCard";
import DataStatusBadge from "@/components/ui/DataStatusBadge";

export default async function MarketsPage() {
  const movements = await getMarketMovements();
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Market intelligence</p><h1 className="mt-2 text-2xl font-semibold text-text">Line Movement</h1><p className="mt-1 max-w-2xl text-sm text-text-muted">Compare opening and current market positions. All providers and prices in this preview are simulated.</p></div>
        <DataStatusBadge label="Simulated market snapshots" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{movements.map((movement) => <MarketMovementCard key={movement.id} movement={movement} />)}</div>
      <div className="rounded-xl border border-dashed border-border-strong bg-surface/50 p-6"><p className="text-sm font-semibold text-text">Best-price comparison is ready for a data adapter.</p><p className="mt-2 text-sm text-text-muted">Normalized sportsbook, line, price, timestamp, and provenance fields can be replaced by authorized API data without changing this interface.</p></div>
    </div>
  );
}
