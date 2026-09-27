import type { PredictionMarketSnapshot } from "@/lib/providers/predictionMarkets";
import PredictionMarketCard from "@/components/markets/PredictionMarketCard";
import EmptyState from "@/components/ui/EmptyState";

export default function KalshiMarketWatch({ markets }: { markets: PredictionMarketSnapshot[] }) {
  if (markets.length === 0) {
    return (
      <EmptyState
        title="Kalshi board is quiet"
        description="No open Kalshi sports markets are cached yet. This refreshes on the next scheduled sync (app/api/cron/sync-prediction-markets)."
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {markets.map((market) => (
        <PredictionMarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
