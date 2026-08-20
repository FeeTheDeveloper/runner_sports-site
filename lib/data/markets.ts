import type { MarketMovementSnapshot } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface MarketMovementRow {
  id: string;
  event: string;
  market: string;
  sportsbook: string;
  opening_line: number | null;
  current_line: number | null;
  opening_price: number;
  current_price: number;
  direction: MarketMovementSnapshot["direction"];
  captured_at: string;
  source: MarketMovementSnapshot["source"];
}

function mapRow(row: MarketMovementRow): MarketMovementSnapshot {
  return {
    id: row.id,
    event: row.event,
    market: row.market,
    sportsbook: row.sportsbook,
    openingLine: row.opening_line ?? row.current_line ?? 0,
    currentLine: row.current_line ?? 0,
    openingPrice: row.opening_price,
    currentPrice: row.current_price,
    direction: row.direction,
    capturedAt: row.captured_at,
    source: row.source,
  };
}

export async function getMarketMovements(): Promise<MarketMovementSnapshot[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("market_movements")
    .select("*")
    .order("captured_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as MarketMovementRow[]).map(mapRow);
}
