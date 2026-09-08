import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export type RunnerFreshnessState = "FRESH" | "DELAYED" | "STALE" | "OFFLINE";
export type RunnerRow = Record<string, unknown> & {
  sport?: string | null;
  event_id?: string | null;
  as_of?: string | null;
  updated_at?: string | null;
  freshness?: string | null;
};

export interface RunnerQuery {
  sport?: string;
  eventId?: string;
  limit?: number;
  maxAgeMinutes?: number;
}

export function runnerQueryFromParams(params: URLSearchParams): RunnerQuery {
  const requestedLimit = Number(params.get("limit") ?? 25);
  const requestedAge = Number(params.get("maxAgeMinutes") ?? 15);
  return {
    sport: params.get("sport")?.trim() || undefined,
    eventId: params.get("eventId")?.trim() || params.get("event")?.trim() || undefined,
    limit: Number.isFinite(requestedLimit) ? requestedLimit : 25,
    maxAgeMinutes: Number.isFinite(requestedAge) ? Math.min(Math.max(requestedAge, 1), 1440) : 15,
  };
}

export function boundedLimit(limit = 25): number {
  return Math.min(Math.max(Math.trunc(limit || 25), 1), 100);
}

export function freshnessFor(row: RunnerRow, maxAgeMinutes = 15): RunnerFreshnessState {
  const value = row.freshness?.toLowerCase();
  if (value === "fresh" || value === "live") return "FRESH";
  if (value === "delayed") return "DELAYED";
  if (value === "stale") return "STALE";
  const timestamp = row.as_of ?? row.updated_at;
  if (!timestamp) return "OFFLINE";
  const age = Date.now() - Date.parse(timestamp);
  if (!Number.isFinite(age)) return "OFFLINE";
  if (age <= maxAgeMinutes * 60_000) return "FRESH";
  if (age <= maxAgeMinutes * 60_000 * 2) return "DELAYED";
  return "STALE";
}

export function freshnessSummary(rows: RunnerRow[], maxAgeMinutes = 15) {
  const states = rows.map((row) => freshnessFor(row, maxAgeMinutes));
  return {
    state: states.length === 0
      ? "OFFLINE"
      : states.includes("STALE")
        ? "STALE"
        : states.includes("DELAYED")
          ? "DELAYED"
          : states.includes("FRESH")
            ? "FRESH"
            : "OFFLINE",
    asOf: rows
      .map((row) => row.as_of ?? row.updated_at)
      .filter((value): value is string => typeof value === "string")
      .sort()
      .at(-1) ?? null,
  } satisfies { state: RunnerFreshnessState; asOf: string | null };
}

type RunnerQueryBuilder = {
  select: (columns: string) => RunnerQueryBuilder;
  order: (column: string, options: { ascending: boolean }) => RunnerQueryBuilder;
  eq: (column: string, value: string) => RunnerQueryBuilder;
  limit: (count: number) => Promise<{ data: RunnerRow[] | null; error: { message: string } | null }>;
};

export async function queryRunnerTable(table: string, options: RunnerQuery = {}): Promise<RunnerRow[]> {
  const limit = boundedLimit(options.limit);
  const client = getSupabaseServerClient() as unknown as {
    from: (name: string) => RunnerQueryBuilder;
  };
  let request = client.from(table).select("*").order("updated_at", { ascending: false });
  if (options.sport) request = request.eq("sport", options.sport);
  if (options.eventId) request = request.eq("event_id", options.eventId);
  const result = await request.limit(limit);
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
}

export async function getRunnerStatus() {
  const [engines, providers] = await Promise.all([
    queryRunnerTable("runner_engine_status", { limit: 10 }),
    queryRunnerTable("runner_provider_status", { limit: 25 }),
  ]);
  return { engines, providers, freshness: freshnessSummary([...engines, ...providers]) };
}
