import "server-only";
import { freshnessSummary, queryRunnerTable, type RunnerQuery } from "@/lib/data/runner";

export async function getRunnerTotals(options: RunnerQuery = {}) {
  const data = await queryRunnerTable("runner_totals", options);
  return { data, freshness: freshnessSummary(data, options.maxAgeMinutes) };
}
