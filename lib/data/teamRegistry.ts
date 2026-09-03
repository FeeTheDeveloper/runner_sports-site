import "server-only";
import type { EspnSportSlug, TeamRegistryEntry } from "@/types";
import { sports } from "@/lib/data/sports";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildTeamIdentityProvider, type EspnTeamIdentityProvider } from "@/lib/providers/oddsApi";

// Canonical team identity registry: one row per team per league in
// `team_registry`, keyed by our own rsa:<league>:<slug> id, with each
// provider's id plus name aliases so Odds API games and ESPN records can be
// joined without provider-specific string matching scattered through the app.

export function buildRegistryId(league: string, espnId: string | undefined, name: string): string {
  const slug = (espnId ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `rsa:${league.toLowerCase()}:${slug}`;
}

export function normalizeTeamName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function buildAliasList(...names: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  const aliases: string[] = [];
  for (const name of names) {
    if (!name) continue;
    const normalized = normalizeTeamName(name);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    aliases.push(name);
  }
  return aliases;
}

export function aliasMatches(entry: Pick<TeamRegistryEntry, "name" | "oddsApiName" | "aliases">, name: string): boolean {
  const target = normalizeTeamName(name);
  if (!target) return false;
  const candidates = [entry.name, entry.oddsApiName, ...entry.aliases];
  return candidates.some((candidate) => candidate !== undefined && normalizeTeamName(candidate) === target);
}

interface TeamRegistryRow {
  id: string;
  league: string;
  name: string;
  abbreviation: string;
  espn_id: string | null;
  odds_api_name: string | null;
  aliases: string[];
}

function rowToEntry(row: TeamRegistryRow): TeamRegistryEntry {
  const entry: TeamRegistryEntry = {
    id: row.id,
    league: row.league,
    name: row.name,
    abbreviation: row.abbreviation,
    aliases: row.aliases,
  };
  if (row.espn_id) entry.espnId = row.espn_id;
  if (row.odds_api_name) entry.oddsApiName = row.odds_api_name;
  return entry;
}

/** Reads all registry rows for one league; returns [] if the registry is unavailable. */
export async function getTeamRegistry(league: string): Promise<TeamRegistryEntry[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("team_registry").select("*").eq("league", league);
  if (error) throw error;
  return (data as unknown as TeamRegistryRow[]).map(rowToEntry);
}

/**
 * Upserts ESPN team facts into the registry. ESPN is the authoritative source
 * for official names/abbreviations; the provider name from The Odds API is
 * recorded alongside so odds feed rows resolve to the same canonical id.
 * Rows are keyed by id so re-seeding is idempotent.
 */
export async function upsertTeamRegistryEntries(
  entries: { league: string; espnId?: string; name: string; abbreviation?: string; oddsApiName?: string; aliases?: string[] }[],
): Promise<number> {
  if (entries.length === 0) return 0;
  const supabase = getSupabaseServerClient();
  const now = new Date().toISOString();
  const rows = entries.map((entry) => ({
    id: buildRegistryId(entry.league, entry.espnId, entry.name),
    league: entry.league,
    name: entry.name,
    abbreviation: entry.abbreviation ?? entry.name.slice(0, 3).toUpperCase(),
    espn_id: entry.espnId ?? null,
    odds_api_name: entry.oddsApiName ?? null,
    aliases: buildAliasList(entry.name, entry.oddsApiName, ...(entry.aliases ?? [])),
    updated_at: now,
  }));
  const { error } = await supabase.from("team_registry").upsert(rows);
  if (error) throw error;
  return rows.length;
}

/**
 * Builds the oddsApi identity-provider seam for one sport: names from The
 * Odds API resolve against the registry (exact, then alias-normalized), and
 * anything unmatched falls back to the derived identity inside oddsApi.
 */
export async function getTeamIdentityProvider(sport: EspnSportSlug): Promise<EspnTeamIdentityProvider> {
  const league = sports.find((s) => s.slug === sport)?.name ?? sport.toUpperCase();
  const entries = await getTeamRegistry(league);
  const byOddsName = new Map(entries.filter((e) => e.oddsApiName).map((e) => [e.oddsApiName as string, e]));
  return buildTeamIdentityProvider((name) => {
    const direct = byOddsName.get(name);
    if (direct) return direct;
    return entries.find((entry) => aliasMatches(entry, name));
  });
}
