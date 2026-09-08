import type { NextRequest } from "next/server";
import { ok } from "@/lib/api/response";
import { getRunnerForecasts } from "@/lib/data/runnerForecasts";
import { getRunnerGameFlow } from "@/lib/data/runnerGameFlow";
import { runnerQueryFromParams } from "@/lib/data/runner";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const query = runnerQueryFromParams(request.nextUrl.searchParams);
  const [forecasts, gameFlow] = await Promise.all([getRunnerForecasts(query), getRunnerGameFlow(query)]);
  return ok({ forecasts: forecasts.data, gameFlow: gameFlow.data }, {
    freshness: forecasts.freshness.state === "STALE" || gameFlow.freshness.state === "STALE"
      ? "STALE"
      : forecasts.freshness.state,
    asOf: forecasts.freshness.asOf ?? gameFlow.freshness.asOf,
  });
}
