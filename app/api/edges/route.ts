import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getEdges } from "@/lib/data/edges";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const minimumEdge = Number(params.get("minEdge") ?? Number.NEGATIVE_INFINITY);
  const edges = (await getEdges()).filter((edge) =>
    filterValue(edge.sport, params.get("sport")) &&
    filterValue(edge.confidence, params.get("confidence")) &&
    filterValue(edge.riskLevel, params.get("risk")) &&
    (!Number.isFinite(minimumEdge) || edge.edge >= minimumEdge),
  );
  const result = paginate(edges, params);
  return ok(result.data, result.meta);
}
