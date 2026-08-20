import { getMarketMovements } from "@/lib/data/markets";
import MarketMovementCard from "@/components/markets/MarketMovementCard";
import DataStatusBadge from "@/components/ui/DataStatusBadge";

export const dynamic = "force-dynamic";

export default async function MarketsPage() {
  const movements = await getMarketMovements();
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Market intelligence</p><h1 className="mt-2 text-2xl font-semibold text-text">Line Movement</h1><p className="mt-1 max-w-2xl text-sm text-text-muted">Opening vs. current lines synced from The Odds API every 15 minutes. Empty until the sync-odds cron job has run at least once.</p></div>
        <DataStatusBadge />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{movements.map((movement) => <MarketMovementCard key={movement.id} movement={movement} />)}</div>
      {movements.length === 0 && <div className="rounded-xl border border-dashed border-border-strong bg-surface/50 p-6"><p className="text-sm font-semibold text-text">No market movements synced yet.</p><p className="mt-2 text-sm text-text-muted">Set ODDS_API_KEY and CRON_SECRET, then trigger POST /api/cron/sync-odds (or wait for the Vercel cron schedule) to populate this page.</p></div>}
    </div>
  );
}
