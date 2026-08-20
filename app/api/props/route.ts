import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getProps } from "@/lib/data/props";

export const revalidate = 60;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const minimumEdge = Number(params.get("minEdge") ?? Number.NEGATIVE_INFINITY);
  const props = (await getProps()).filter((prop) =>
    filterValue(prop.sport, params.get("sport")) &&
    filterValue(prop.market, params.get("market")) &&
    filterValue(prop.confidence, params.get("confidence")) &&
    filterValue(prop.gameId, params.get("gameId")) &&
    (!Number.isFinite(minimumEdge) || prop.edge >= minimumEdge),
  );
  const result = paginate(props, params);
  return ok(result.data, result.meta);
}
