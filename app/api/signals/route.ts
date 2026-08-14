import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getMarketSignals } from "@/lib/data/signals";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const signals = (await getMarketSignals()).filter((item) =>
    filterValue(item.market, params.get("market")) && filterValue(item.movement.direction, params.get("direction")),
  );
  const result = paginate(signals, params);
  return ok(result.data, result.meta);
}
