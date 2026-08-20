import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getMarketMovements } from "@/lib/data/markets";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const movements = (await getMarketMovements()).filter((item) =>
    filterValue(item.direction, params.get("direction")) && filterValue(item.sportsbook, params.get("sportsbook")),
  );
  const result = paginate(movements, params);
  return ok(result.data, result.meta);
}
