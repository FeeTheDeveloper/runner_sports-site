import type { NextRequest } from "next/server";
import { ok, paginate } from "@/lib/api/response";
import { getEspnRecords } from "@/lib/data/espn";

export const revalidate = 30;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const records = await getEspnRecords({
    sport: params.get("sport") ?? undefined,
    league: params.get("league") ?? undefined,
    dataType: params.get("dataType") ?? undefined,
    entityId: params.get("entityId") ?? undefined,
  });
  const result = paginate(records, params);
  return ok(result.data, result.meta);
}
