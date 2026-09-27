import type { NextRequest } from "next/server";
import type { BetResult } from "@/types";
import { badRequest, filterValue, ok, paginate } from "@/lib/api/response";
import { addTrackedBet, getTrackedBets, type NewTrackedBet } from "@/lib/data/tracker";
import { trackerResponse } from "@/lib/api/trackerResponse";

export const revalidate = 0;

const VALID_RESULTS: BetResult[] = ["win", "loss", "push", "pending"];

export async function GET(request: NextRequest) {
  return trackerResponse(async () => {
    const params = request.nextUrl.searchParams;
    const bets = (await getTrackedBets()).filter((bet) =>
      filterValue(bet.sport, params.get("sport")) && filterValue(bet.result, params.get("result")),
    );
    const result = paginate(bets, params);
    return ok(result.data, result.meta);
  });
}

export async function POST(request: NextRequest) {
  return trackerResponse(async () => {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Request body must be a JSON object");
    }

    const { date, sport, event, selection, market, sportsbook, odds, stake, result, closingOdds, clv } = body as Record<
      string,
      unknown
    >;

    const requiredStrings = { date, sport, event, selection, market, sportsbook };
    for (const [key, value] of Object.entries(requiredStrings)) {
      if (typeof value !== "string" || value.trim() === "") {
        return badRequest(`'${key}' is required and must be a non-empty string`);
      }
    }
    if (typeof odds !== "number" || !Number.isSafeInteger(odds) || Math.abs(odds) < 100) {
      return badRequest("'odds' must be integer American odds of at least +100 or at most -100");
    }
    if (typeof stake !== "number" || !Number.isFinite(stake) || stake <= 0) {
      return badRequest("'stake' is required and must be a positive number");
    }
    if (result !== undefined && !VALID_RESULTS.includes(result as BetResult)) {
      return badRequest(`'result' must be one of: ${VALID_RESULTS.join(", ")}`);
    }
    if (closingOdds !== undefined && (typeof closingOdds !== "number" || !Number.isSafeInteger(closingOdds) || Math.abs(closingOdds) < 100)) {
      return badRequest("'closingOdds' must be valid integer American odds");
    }
    if (clv !== undefined && (typeof clv !== "number" || !Number.isFinite(clv))) {
      return badRequest("'clv' must be a finite number");
    }
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
      return badRequest("'date' must be a valid YYYY-MM-DD date");
    }

    const payload: NewTrackedBet = {
      date: date as string,
      sport: sport as string,
      event: event as string,
      selection: selection as string,
      market: market as string,
      sportsbook: sportsbook as string,
      odds,
      stake,
      result: result as BetResult | undefined,
      closingOdds: typeof closingOdds === "number" ? closingOdds : undefined,
      clv: typeof clv === "number" ? clv : undefined,
    };

    const bet = await addTrackedBet(payload);
    return ok(bet);
  });
}
