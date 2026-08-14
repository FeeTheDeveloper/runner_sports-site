import type { NextRequest } from "next/server";
import { filterValue, ok, paginate } from "@/lib/api/response";
import { getModels } from "@/lib/data/models";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const models = (await getModels()).filter((model) =>
    filterValue(model.sport, params.get("sport")) && filterValue(model.status, params.get("status")),
  );
  const result = paginate(models, params);
  return ok(result.data, result.meta);
}
