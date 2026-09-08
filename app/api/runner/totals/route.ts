import type { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { runnerQueryFromParams } from "@/lib/data/runner";
import { getRunnerTotals } from "@/lib/data/runnerTotals";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getRunnerTotals(runnerQueryFromParams(request.nextUrl.searchParams));
  return ok(result.data, { freshness: result.freshness });
}
