import "server-only";
import { freshnessSummary, queryRunnerTable, type RunnerQuery } from "@/lib/data/runner";

export async function getRunnerSignals(options: RunnerQuery = {}) {
  const data = await queryRunnerTable("runner_signals", options);
  return { data, freshness: freshnessSummary(data, options.maxAgeMinutes) };
}
