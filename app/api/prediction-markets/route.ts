import type { NextRequest } from "next/server";
import { badRequest, ok } from "@/lib/api/response";
import { getPredictionMarkets } from "@/lib/data/predictionMarkets";
import type { PredictionMarketProvider } from "@/lib/providers/predictionMarkets";

export const revalidate = 15;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const provider = params.get("provider");
  if (provider && provider !== "kalshi" && provider !== "polymarket") {
    return badRequest("provider must be 'kalshi' or 'polymarket'");
  }

  const requestedLimit = Number(params.get("limit") ?? 100);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 250) : 100;
  const markets = await getPredictionMarkets({
    provider: provider as PredictionMarketProvider | undefined,
    status: params.get("status") ?? undefined,
    limit,
  });

  return ok(markets, {
    total: markets.length,
    providers: ["kalshi", "polymarket"],
    purpose: "read-only market intelligence",
  });
}
