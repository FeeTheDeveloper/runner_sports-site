import { NextResponse, type NextRequest } from "next/server";
import type { EspnRecordRow, EspnSportSlug, TeamRegistryEntry } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import {
  fetchInjuriesRecord,
  fetchRosterRecord,
  fetchScoreboardRecord,
  fetchStandingsRecord,
  fetchSummaryRecord,
  fetchTeams,
  fetchTeamsRecord,
} from "@/lib/providers/espnApi";
import { buildAliasList, getTeamRegistry, upsertTeamRegistryEntries } from "@/lib/data/teamRegistry";
import { sports } from "@/lib/data/sports";
import { authorizeCronRequest } from "../auth";

export const revalidate = 0;

const SPORT_SLUGS: EspnSportSlug[] = ["nfl", "nba", "mlb", "nhl", "ncaaf", "ncaab", "wnba"];

// Freshness tiers: different data decays at different rates, so each tier is
// ingested independently rather than via one monolithic job. A manual run can
// be narrowed with query params (e.g. ?tiers=scoreboard&sports=nba).
const TIERS = ["scoreboard", "injuries", "rosters", "standings", "teams"] as const;
type Tier = (typeof TIERS)[number];

// The provider's in-memory cache TTLs mirror these freshness windows so a
// warm instance does not re-hit ESPN inside a tier's own window.
const TIER_SCHEDULE_HINTS: Record<Tier, string> = {
  scoreboard: "every 5 minutes",
  injuries: "hourly",
  rosters: "every 6 hours",
  standings: "every 30 minutes",
  teams: "daily",
};

// Same documented gap as sync-odds: our domain payloads are JSON-serializable
// but do not structurally satisfy the generated `Json` index signature.
function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

function leagueOf(sport: EspnSportSlug): string {
  return sports.find((s) => s.slug === sport)?.name ?? sport.toUpperCase();
}

type Supabase = ReturnType<typeof getSupabaseServerClient>;

interface TierResult {
  records: number;
  registryTeams?: number;
  errors: string[];
}

class TierCollector {
  private readonly records: EspnRecordRow[] = [];
  readonly errors: string[] = [];

  constructor(
    private readonly supabase: Supabase,
    private readonly sport: EspnSportSlug,
  ) {}

  /** Soft-fail boundary: a rejected fetch is logged and skipped, never thrown. */
  async add(work: () => Promise<EspnRecordRow | undefined>, label: string) {
    try {
      const record = await work();
      if (record) this.records.push(record);
    } catch (error) {
      this.errors.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  get count() {
    return this.records.length;
  }

  async flush() {
    if (this.records.length === 0) return;
    const { error } = await this.supabase.from("espn_records").upsert(
      this.records.map((record) => ({
        id: record.id,
        provider: record.provider,
        sport: record.sport,
        league: record.league,
        data_type: record.dataType,
        entity_id: record.entityId,
        payload: toJson(record.payload),
        retrieved_at: record.retrievedAt,
        source: toJson(record.source),
        updated_at: new Date().toISOString(),
      })),
    );
    if (error) throw error;
  }
}

async function syncScoreboardTier(collector: TierCollector, sport: EspnSportSlug) {
  const record = await fetchScoreboardRecord(sport);
  collector.add(async () => record, "scoreboard");

  // Event summaries for games happening today or imminently carry
  // play-by-play, win probability, predictor, BPI/power index, and ESPN's
  // own odds — the cross-check surface for The Odds API market feed.
  const events = record.payload as { startsAt: string; eventId: string }[];
  const horizon = Date.now() + 24 * 60 * 60 * 1000;
  for (const event of events) {
    if (new Date(event.startsAt).getTime() > horizon) continue;
    await collector.add(() => fetchSummaryRecord(sport, event.eventId), `summary ${event.eventId}`);
  }
}

async function syncRostersTier(collector: TierCollector, sport: EspnSportSlug) {
  const registry = await getTeamRegistry(leagueOf(sport));
  for (const entry of registry) {
    if (!entry.espnId) continue;
    await collector.add(() => fetchRosterRecord(sport, entry.espnId as string), `roster ${entry.espnId}`);
  }
}

async function syncTeamsTier(collector: TierCollector, sport: EspnSportSlug): Promise<number> {
  const record = await fetchTeamsRecord(sport);
  await collector.add(async () => record, "teams");

  // Seed the canonical registry from ESPN team facts. Existing Odds API name
  // joins are preserved — ESPN never clobbers a mapping it does not own.
  const league = leagueOf(sport);
  const teams = record.payload as Awaited<ReturnType<typeof fetchTeams>>;
  if (teams.length === 0) return 0;
  const byEspnId = new Map(
    (await getTeamRegistry(league)).filter((e: TeamRegistryEntry) => e.espnId).map((e) => [e.espnId as string, e]),
  );
  return upsertTeamRegistryEntries(
    teams.map((team) => {
      const prior = byEspnId.get(team.espnId);
      return {
        league,
        espnId: team.espnId,
        name: team.displayName ?? team.name,
        abbreviation: team.abbreviation,
        oddsApiName: prior?.oddsApiName,
        aliases: buildAliasList(team.name, team.location, ...(prior?.aliases ?? [])),
        logoUrl: team.logoUrl ?? prior?.logoUrl,
      };
    }),
  );
}

async function syncTier(supabase: Supabase, sport: EspnSportSlug, tier: Tier): Promise<TierResult> {
  const collector = new TierCollector(supabase, sport);
  const result: TierResult = { records: 0, errors: collector.errors };

  try {
    switch (tier) {
      case "scoreboard":
        await syncScoreboardTier(collector, sport);
        break;
      case "injuries":
        await collector.add(() => fetchInjuriesRecord(sport), "injuries");
        break;
      case "rosters":
        await syncRostersTier(collector, sport);
        break;
      case "standings":
        await collector.add(() => fetchStandingsRecord(sport), "standings");
        break;
      case "teams":
        result.registryTeams = await syncTeamsTier(collector, sport);
        break;
    }
    await collector.flush();
  } catch (error) {
    // A hard failure inside the tier (e.g. persistence down) is reported per
    // tier so the other sports/tiers still complete.
    collector.errors.push(`tier ${tier}: ${error instanceof Error ? error.message : String(error)}`);
  }

  result.records = collector.count;
  return result;
}

async function handleSync(request: NextRequest) {
  const unauthorized = authorizeCronRequest(request);
  if (unauthorized) return unauthorized;

  const params = request.nextUrl.searchParams;
  const tiers = (params.get("tiers")?.split(",").filter(Boolean) ?? [...TIERS]).filter((t): t is Tier =>
    (TIERS as readonly string[]).includes(t),
  );
  const sportSlugs = (params.get("sports")?.split(",").filter(Boolean) ?? SPORT_SLUGS).filter(
    (s): s is EspnSportSlug => (SPORT_SLUGS as string[]).includes(s),
  );

  const supabase = getSupabaseServerClient();
  const results: Record<string, Record<string, TierResult>> = {};

  for (const sport of sportSlugs) {
    results[sport] = {};
    for (const tier of tiers) {
      results[sport][tier] = await syncTier(supabase, sport, tier);
    }
  }

  return NextResponse.json({
    data: results,
    schedule: TIER_SCHEDULE_HINTS,
    syncedAt: new Date().toISOString(),
  });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
