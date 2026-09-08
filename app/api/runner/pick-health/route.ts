import type { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { runnerQueryFromParams } from "@/lib/data/runner";
import { getRunnerPickHealth } from "@/lib/data/runnerPickHealth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getRunnerPickHealth(runnerQueryFromParams(request.nextUrl.searchParams));
  return ok(result.data, { freshness: result.freshness });
}
