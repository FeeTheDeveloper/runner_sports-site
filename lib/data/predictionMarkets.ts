import type { PredictionMarketSnapshot, PredictionMarketProvider } from "@/lib/providers/predictionMarkets";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface PredictionMarketRow {
  id: string;
  provider: PredictionMarketProvider;
  external_id: string;
  event_id: string | null;
  title: string;
  sport: string | null;
  market_type: string;
  status: string;
  yes_bid: number | null;
  yes_ask: number | null;
  last_price: number | null;
  implied_probability: number | null;
  liquidity: number | null;
  volume: number | null;
  closes_at: string | null;
  rules: string | null;
  raw: PredictionMarketSnapshot["raw"];
  source_timestamp: string;
}

function mapRow(row: PredictionMarketRow): PredictionMarketSnapshot {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.external_id,
    eventId: row.event_id ?? undefined,
    title: row.title,
    sport: row.sport ?? undefined,
    marketType: row.market_type,
    status: row.status,
    yesBid: row.yes_bid ?? undefined,
    yesAsk: row.yes_ask ?? undefined,
    lastPrice: row.last_price ?? undefined,
    impliedProbability: row.implied_probability ?? undefined,
    liquidity: row.liquidity ?? undefined,
    volume: row.volume ?? undefined,
    closesAt: row.closes_at ?? undefined,
    rules: row.rules ?? undefined,
    raw: row.raw,
    sourceTimestamp: row.source_timestamp,
  };
}

export async function getPredictionMarkets(filters?: {
  provider?: PredictionMarketProvider;
  sport?: string;
  status?: string;
  limit?: number;
}): Promise<PredictionMarketSnapshot[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("prediction_markets")
    .select("*")
    .order("volume", { ascending: false, nullsFirst: false })
    .limit(filters?.limit ?? 100);

  if (filters?.provider) query = query.eq("provider", filters.provider);
  if (filters?.sport) query = query.ilike("sport", filters.sport);
  if (filters?.status) query = query.eq("status", filters.status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as PredictionMarketRow[]).map(mapRow);
}
