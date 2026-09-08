import "server-only";
import { freshnessSummary, queryRunnerTable, type RunnerQuery } from "@/lib/data/runner";

export async function getRunnerForecasts(options: RunnerQuery = {}) {
  const data = await queryRunnerTable("runner_forecasts", options);
  return { data, freshness: freshnessSummary(data, options.maxAgeMinutes) };
}
