import type { MarketSignal } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface SignalRow {
  id: string;
  event: string;
  market: string;
  movement: MarketSignal["movement"];
  model_market_delta: number;
  note: string;
}

function mapRow(row: SignalRow): MarketSignal {
  return {
    id: row.id,
    event: row.event,
    market: row.market,
    movement: row.movement,
    modelMarketDelta: row.model_market_delta,
    note: row.note,
  };
}

export async function getMarketSignals(): Promise<MarketSignal[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("signals").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as SignalRow[]).map(mapRow);
}
