import "server-only";
import { freshnessSummary, queryRunnerTable, type RunnerQuery } from "@/lib/data/runner";

export async function getRunnerEvidence(options: RunnerQuery = {}) {
  const data = await queryRunnerTable("runner_research_evidence", options);
  return { data, freshness: freshnessSummary(data, options.maxAgeMinutes) };
}
