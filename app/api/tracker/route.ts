import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getTrackedBets } from "@/lib/data/tracker";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const bets = (await getTrackedBets()).filter((bet) =>
    filterValue(bet.sport, params.get("sport")) && filterValue(bet.result, params.get("result")),
  );
  const result = paginate(bets, params);
  return ok(result.data, result.meta);
}
