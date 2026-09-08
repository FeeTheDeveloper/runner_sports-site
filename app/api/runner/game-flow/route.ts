import type { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { runnerQueryFromParams } from "@/lib/data/runner";
import { getRunnerGameFlow } from "@/lib/data/runnerGameFlow";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const result = await getRunnerGameFlow(runnerQueryFromParams(request.nextUrl.searchParams));
  return ok(result.data, { freshness: result.freshness });
}
