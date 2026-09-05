import Link from "next/link";
import { getPredictionMarkets } from "@/lib/data/predictionMarkets";
import PredictionMarketCard from "@/components/markets/PredictionMarketCard";
import DataStatusBadge from "@/components/ui/DataStatusBadge";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function PredictionMarketsPage({ searchParams }: { searchParams: Promise<{ provider?: "kalshi" | "polymarket" }> }) {
  const { provider } = await searchParams;
  const markets = await getPredictionMarkets({ provider, status: "open", limit: 250 });
  const kalshi = markets.filter((market) => market.provider === "kalshi").length;
  const polymarket = markets.filter((market) => market.provider === "polymarket").length;

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Prediction-market intelligence</p>
          <h1 className="mt-2 text-2xl font-semibold text-text">Market Probability Board</h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">Read-only Kalshi and Polymarket pricing, normalized into comparable probabilities for the RSA signal engine.</p>
        </div>
        <DataStatusBadge label="Live snapshots — Kalshi + Polymarket" />
      </div>
      <div className="flex gap-3 text-xs text-text-muted"><span>{kalshi} Kalshi</span><span>•</span><span>{polymarket} Polymarket</span></div>
      <div className="flex flex-wrap gap-2">
        <Link href="/prediction-markets" className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-muted">All providers</Link>
        <Link href="/prediction-markets?provider=kalshi" className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-muted">Kalshi</Link>
        <Link href="/prediction-markets?provider=polymarket" className="rounded-lg border border-border px-3 py-2 text-xs font-bold text-text-muted">Polymarket</Link>
      </div>
      {markets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{markets.map((market) => <PredictionMarketCard key={market.id} market={market} />)}</div>
      ) : (
        <EmptyState title="No prediction markets synced yet" description="Apply migration 0002, then trigger the protected prediction-market sync endpoint." />
      )}
    </div>
  );
}
