import "server-only";
import { freshnessSummary, queryRunnerTable, type RunnerQuery } from "@/lib/data/runner";

export async function getRunnerPickHealth(options: RunnerQuery = {}) {
  const data = await queryRunnerTable("runner_pick_health", options);
  return { data, freshness: freshnessSummary(data, options.maxAgeMinutes) };
}
