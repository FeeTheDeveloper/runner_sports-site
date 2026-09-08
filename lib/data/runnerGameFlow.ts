import "server-only";
import { freshnessSummary, queryRunnerTable, type RunnerQuery } from "@/lib/data/runner";

export async function getRunnerGameFlow(options: RunnerQuery = {}) {
  const data = await queryRunnerTable("runner_game_flow", options);
  return { data, freshness: freshnessSummary(data, options.maxAgeMinutes) };
}
