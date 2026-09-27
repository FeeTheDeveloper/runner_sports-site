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

/** Receipt timestamps require a real calendar date and explicit UTC/offset. */
export function validRunnerTimestamp(timestamp: unknown, now = Date.now()): number | null {
  if (typeof timestamp !== "string" || !Number.isFinite(now)) return null;
  const match = /^(\d{4}-\d{2}-\d{2})[T ]([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u.exec(timestamp);
  if (!match) return null;
  const date = match[1];
  const day = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(day) || new Date(day).toISOString().slice(0, 10) !== date) return null;
  const time = Date.parse(timestamp);
  return Number.isFinite(time) && time <= now ? time : null;
}

function receiptTime(row: RunnerRow, now: number): number | null {
  // A bad authoritative as_of must not be rescued by a later storage update.
  return validRunnerTimestamp(row.as_of ?? row.updated_at, now);
}

const freshnessSeverity: Record<RunnerFreshnessState, number> = { FRESH: 0, DELAYED: 1, STALE: 2, OFFLINE: 3 };

export function freshnessFor(row: RunnerRow, maxAgeMinutes = 15, now = Date.now()): RunnerFreshnessState {
  const timestamp = receiptTime(row, now);
  if (timestamp === null || !Number.isFinite(now) || !Number.isFinite(maxAgeMinutes) || maxAgeMinutes <= 0) return "OFFLINE";
  const age = now - timestamp;
  const ageState: RunnerFreshnessState = age <= maxAgeMinutes * 60_000 ? "FRESH" : age <= maxAgeMinutes * 120_000 ? "DELAYED" : "STALE";
  const value = typeof row.freshness === "string" ? row.freshness.trim().toLowerCase() : "";
  const reported: RunnerFreshnessState = value === "offline" || value === "unavailable" || value === "unknown" ? "OFFLINE" : value === "stale" ? "STALE" : value === "delayed" ? "DELAYED" : "FRESH";
  // Saved labels can lower confidence, never extend a receipt's lifetime.
  return freshnessSeverity[reported] > freshnessSeverity[ageState] ? reported : ageState;
}

export function freshnessSummary(rows: RunnerRow[], maxAgeMinutes = 15, now = Date.now()) {
  const states = rows.map((row) => freshnessFor(row, maxAgeMinutes, now));
  const times = rows.map(row => receiptTime(row, now)).filter((value): value is number => value !== null);
  return {
    state: states.length ? states.reduce((worst, state) => freshnessSeverity[state] > freshnessSeverity[worst] ? state : worst) : "OFFLINE",
    asOf: times.length ? new Date(Math.max(...times)).toISOString() : null,
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
