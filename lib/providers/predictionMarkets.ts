import "server-only";
import { constants, createPrivateKey, sign } from "node:crypto";

export type PredictionMarketProvider = "kalshi" | "polymarket";

export interface PredictionMarketSnapshot {
  id: string;
  provider: PredictionMarketProvider;
  externalId: string;
  eventId?: string;
  title: string;
  sport?: string;
  marketType: string;
  status: string;
  yesBid?: number;
  yesAsk?: number;
  lastPrice?: number;
  impliedProbability?: number;
  liquidity?: number;
  volume?: number;
  closesAt?: string;
  rules?: string;
  sourceTimestamp: string;
  raw: Record<string, unknown>;
}

const KALSHI_BASE = "https://external-api.kalshi.com/trade-api/v2";
const POLYMARKET_GAMMA_BASE = "https://gamma-api.polymarket.com";

function kalshiHeaders(path: string): HeadersInit {
  const keyId = process.env.KALSHI_API_KEY_ID;
  const encodedPrivateKey = process.env.KALSHI_PRIVATE_KEY_BASE64;
  if (!keyId || !encodedPrivateKey) return {};

  const timestamp = Date.now().toString();
  const privateKey = createPrivateKey(Buffer.from(encodedPrivateKey, "base64").toString("utf8"));
  const signature = sign("sha256", Buffer.from(`${timestamp}GET${path}`), {
    key: privateKey,
    padding: constants.RSA_PKCS1_PSS_PADDING,
    saltLength: 32,
  }).toString("base64");

  return {
    "KALSHI-ACCESS-KEY": keyId,
    "KALSHI-ACCESS-SIGNATURE": signature,
    "KALSHI-ACCESS-TIMESTAMP": timestamp,
  };
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function midpoint(bid?: number, ask?: number, last?: number): number | undefined {
  if (bid !== undefined && ask !== undefined) return (bid + ask) / 2;
  return last;
}

function parseJsonArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface KalshiMarket {
  ticker: string;
  event_ticker: string;
  title?: string;
  subtitle?: string;
  yes_sub_title?: string;
  market_type?: string;
  status: string;
  yes_bid_dollars?: string;
  yes_ask_dollars?: string;
  last_price_dollars?: string;
  liquidity_dollars?: string;
  volume_fp?: string;
  close_time?: string;
  rules_primary?: string;
  updated_time?: string;
  [key: string]: unknown;
}

interface KalshiEvent {
  event_ticker: string;
  title: string;
  category?: string;
  markets?: KalshiMarket[];
}

interface KalshiEventsResponse {
  events?: KalshiEvent[];
  cursor?: string;
}

export async function fetchKalshiSportsMarkets(): Promise<PredictionMarketSnapshot[]> {
  const results: PredictionMarketSnapshot[] = [];
  let cursor: string | undefined;

  // Bound pagination so one cron invocation cannot run indefinitely.
  for (let page = 0; page < 5; page += 1) {
    const url = new URL(`${KALSHI_BASE}/events`);
    url.searchParams.set("status", "open");
    url.searchParams.set("with_nested_markets", "true");
    url.searchParams.set("limit", "200");
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url, {
      cache: "no-store",
      headers: kalshiHeaders("/trade-api/v2/events"),
    });
    if (!response.ok) {
      const credentialHint = process.env.KALSHI_API_KEY_ID ? "Check the Kalshi key ID/private key pair." : "Add read-only Kalshi credentials.";
      throw new Error(`Kalshi market request failed (${response.status}). ${credentialHint}`);
    }
    const payload = (await response.json()) as KalshiEventsResponse;

    for (const event of payload.events ?? []) {
      if (event.category?.toLowerCase() !== "sports") continue;
      for (const market of event.markets ?? []) {
        const yesBid = optionalNumber(market.yes_bid_dollars);
        const yesAsk = optionalNumber(market.yes_ask_dollars);
        const lastPrice = optionalNumber(market.last_price_dollars);
        results.push({
          id: `kalshi:${market.ticker}`,
          provider: "kalshi",
          externalId: market.ticker,
          eventId: market.event_ticker,
          title: market.title || market.subtitle || market.yes_sub_title || event.title,
          sport: event.category,
          marketType: market.market_type || "binary",
          status: market.status,
          yesBid,
          yesAsk,
          lastPrice,
          impliedProbability: midpoint(yesBid, yesAsk, lastPrice),
          liquidity: optionalNumber(market.liquidity_dollars),
          volume: optionalNumber(market.volume_fp),
          closesAt: market.close_time,
          rules: market.rules_primary,
          sourceTimestamp: market.updated_time || new Date().toISOString(),
          raw: market,
        });
      }
    }

    cursor = payload.cursor || undefined;
    if (!cursor) break;
  }

  return results;
}

interface PolymarketMarket {
  id: string;
  conditionId?: string;
  question: string;
  slug?: string;
  active?: boolean;
  closed?: boolean;
  acceptingOrders?: boolean;
  outcomes?: string;
  outcomePrices?: string;
  bestBid?: number;
  bestAsk?: number;
  lastTradePrice?: number;
  liquidityNum?: number;
  volumeNum?: number;
  endDate?: string;
  description?: string;
  updatedAt?: string;
  events?: Array<{ ticker?: string; title?: string }>;
  [key: string]: unknown;
}

export async function fetchPolymarketSportsMarkets(): Promise<PredictionMarketSnapshot[]> {
  const url = new URL(`${POLYMARKET_GAMMA_BASE}/markets`);
  url.searchParams.set("active", "true");
  url.searchParams.set("closed", "false");
  url.searchParams.set("tag_id", "1"); // Polymarket's top-level sports tag.
  url.searchParams.set("related_tags", "true");
  url.searchParams.set("order", "volume24hr");
  url.searchParams.set("ascending", "false");
  url.searchParams.set("limit", "250");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Polymarket market request failed (${response.status})`);
  const markets = (await response.json()) as PolymarketMarket[];

  return markets.map((market) => {
    const outcomes = parseJsonArray(market.outcomes).map(String);
    const prices = parseJsonArray(market.outcomePrices).map(optionalNumber);
    const yesIndex = outcomes.findIndex((outcome) => outcome.toLowerCase() === "yes");
    const outcomePrice = yesIndex >= 0 ? prices[yesIndex] : prices[0];
    const yesBid = optionalNumber(market.bestBid);
    const yesAsk = optionalNumber(market.bestAsk);
    const lastPrice = optionalNumber(market.lastTradePrice) ?? outcomePrice;

    return {
      id: `polymarket:${market.id}`,
      provider: "polymarket",
      externalId: market.id,
      eventId: market.conditionId || market.events?.[0]?.ticker,
      title: market.question,
      sport: "Sports",
      marketType: outcomes.length > 2 ? "multi-outcome" : "binary",
      status: market.acceptingOrders ? "open" : market.closed ? "closed" : "paused",
      yesBid,
      yesAsk,
      lastPrice,
      impliedProbability: midpoint(yesBid, yesAsk, lastPrice),
      liquidity: optionalNumber(market.liquidityNum),
      volume: optionalNumber(market.volumeNum),
      closesAt: market.endDate,
      rules: market.description,
      sourceTimestamp: market.updatedAt || new Date().toISOString(),
      raw: market,
    } satisfies PredictionMarketSnapshot;
  });
}

export async function fetchPredictionMarkets(): Promise<{
  markets: PredictionMarketSnapshot[];
  errors: Array<{ provider: PredictionMarketProvider; message: string }>;
}> {
  const settled = await Promise.allSettled([fetchKalshiSportsMarkets(), fetchPolymarketSportsMarkets()]);
  const providers: PredictionMarketProvider[] = ["kalshi", "polymarket"];
  const markets: PredictionMarketSnapshot[] = [];
  const errors: Array<{ provider: PredictionMarketProvider; message: string }> = [];

  settled.forEach((result, index) => {
    if (result.status === "fulfilled") markets.push(...result.value);
    else errors.push({ provider: providers[index], message: result.reason instanceof Error ? result.reason.message : "Unknown provider error" });
  });

  return { markets, errors };
}
