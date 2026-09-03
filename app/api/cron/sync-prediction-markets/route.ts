import { NextResponse, type NextRequest } from "next/server";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchPredictionMarkets } from "@/lib/providers/predictionMarkets";

export const revalidate = 0;
export const maxDuration = 60;

function toJson(value: Record<string, unknown>): Json {
  return value as Json;
}

async function handleSync(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: { code: "CONFIG", message: "CRON_SECRET is not set" } }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid or missing bearer token" } }, { status: 401 });
  }

  const { markets, errors } = await fetchPredictionMarkets();
  const supabase = getSupabaseServerClient();
  const syncedAt = new Date().toISOString();

  if (markets.length > 0) {
    const currentRows = markets.map((market) => ({
      id: market.id,
      provider: market.provider,
      external_id: market.externalId,
      event_id: market.eventId ?? null,
      title: market.title,
      sport: market.sport ?? null,
      market_type: market.marketType,
      status: market.status,
      yes_bid: market.yesBid ?? null,
      yes_ask: market.yesAsk ?? null,
      last_price: market.lastPrice ?? null,
      implied_probability: market.impliedProbability ?? null,
      liquidity: market.liquidity ?? null,
      volume: market.volume ?? null,
      closes_at: market.closesAt ?? null,
      rules: market.rules ?? null,
      raw: toJson(market.raw),
      source_timestamp: market.sourceTimestamp,
      updated_at: syncedAt,
    }));
    const { error: currentError } = await supabase.from("prediction_markets").upsert(currentRows);
    if (currentError) throw currentError;

    const snapshotRows = markets.map((market) => ({
      market_id: market.id,
      yes_bid: market.yesBid ?? null,
      yes_ask: market.yesAsk ?? null,
      last_price: market.lastPrice ?? null,
      implied_probability: market.impliedProbability ?? null,
      liquidity: market.liquidity ?? null,
      volume: market.volume ?? null,
      captured_at: syncedAt,
    }));
    const { error: snapshotError } = await supabase.from("prediction_market_snapshots").insert(snapshotRows);
    if (snapshotError) throw snapshotError;
  }

  const counts = markets.reduce<Record<string, number>>((totals, market) => {
    totals[market.provider] = (totals[market.provider] ?? 0) + 1;
    return totals;
  }, {});

  return NextResponse.json({
    data: { counts, errors, mode: "read-only", syncedAt },
    meta: { partial: errors.length > 0, executionEnabled: false },
  });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
