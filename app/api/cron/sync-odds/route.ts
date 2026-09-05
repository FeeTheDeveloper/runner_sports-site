import { NextResponse, type NextRequest } from "next/server";
import type { EspnRosterAthlete, Player, SourceMetadata } from "@/types";
import { getEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import {
  fetchEventPlayerProps,
  fetchSportOdds,
  type EspnTeamIdentityProvider,
  type MappedGame,
  type MappedPlayerPropMarket,
} from "@/lib/providers/oddsApi";
import { getTeamIdentityProvider } from "@/lib/data/teamRegistry";
import { searchEspnAthlete } from "@/lib/providers/espnApi";
import { americanToImpliedProbability, computeConsensusProbability, computeEdge, devigTwoWay } from "@/lib/models/edgeCalculator";
import { authorizeCronRequest } from "../auth";

export const revalidate = 0;

const SPORT_SLUGS = ["nfl", "ncaaf", "nba", "wnba", "mlb", "nhl"] as const;
type SportSlug = (typeof SPORT_SLUGS)[number];

// Keep prop ingestion useful and quota-bounded. The event endpoint charges by
// market, so each sport requests three high-signal O/U markets for only the
// nearest four events inside the next 36 hours.
const PROP_MARKETS: Record<SportSlug, string[]> = {
  nfl: ["player_pass_yds", "player_rush_yds", "player_reception_yds"],
  ncaaf: ["player_pass_yds", "player_rush_yds", "player_reception_yds"],
  nba: ["player_points", "player_rebounds", "player_assists"],
  wnba: ["player_points", "player_rebounds", "player_assists"],
  mlb: ["batter_hits", "batter_total_bases", "pitcher_strikeouts"],
  nhl: ["player_shots_on_goal", "player_points", "player_total_saves"],
};
const PROP_EVENT_LIMIT = 4;
const PROP_HORIZON_MS = 36 * 60 * 60 * 1000;

// Our domain types (Team, SourceMetadata, BookOddsSnapshot[], ...) are known
// to be plain JSON-serializable data, but don't structurally satisfy the
// generated `Json` index-signature type — this cast documents that gap
// rather than loosening it to `any`.
function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

function movementId(gameId: string, market: string, sportsbook: string): string {
  return `${gameId}:${market}:${sportsbook}`.toLowerCase().replace(/\s+/g, "-");
}

interface MovementRow {
  id: string;
  event: string;
  market: string;
  sportsbook: string;
  opening_line: number | null;
  current_line: number | null;
  opening_price: number;
  current_price: number;
  direction: "up" | "down" | "flat";
  captured_at: string;
  source: SourceMetadata;
}

interface AthleteIdentity extends Player {
  teamName: string;
}

function normalizeName(value: string): string {
  return value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

async function loadAthleteIdentities(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  slug: SportSlug,
  league: string,
): Promise<Map<string, AthleteIdentity>> {
  const [rosterResult, teamResult, storedResult] = await Promise.all([
    supabase.from("espn_records").select("entity_id, payload, retrieved_at").eq("sport", slug).eq("data_type", "roster").order("retrieved_at", { ascending: false }),
    supabase.from("team_registry").select("espn_id, name, abbreviation").eq("league", league),
    supabase.from("props").select("player").eq("sport", slug.toUpperCase()).order("updated_at", { ascending: false }).limit(500),
  ]);
  if (rosterResult.error) throw rosterResult.error;
  if (teamResult.error) throw teamResult.error;
  if (storedResult.error) throw storedResult.error;
  const rosterRows = rosterResult.data;
  const teamRows = teamResult.data;
  const teams = new Map(
    (teamRows ?? []).filter((team) => team.espn_id).map((team) => [team.espn_id as string, team]),
  );
  const identities = new Map<string, AthleteIdentity>();

  for (const row of storedResult.data ?? []) {
    const value = row.player;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const player = value as unknown as Player;
    if (!player.name || !player.headshotUrl) continue;
    identities.set(normalizeName(player.name), {
      ...player,
      teamName: player.team,
    });
  }

  for (const row of rosterRows ?? []) {
    const team = teams.get(row.entity_id);
    if (!team || !Array.isArray(row.payload)) continue;
    for (const value of row.payload) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const athlete = value as unknown as EspnRosterAthlete;
      if (!athlete.name || !athlete.espnId) continue;
      identities.set(normalizeName(athlete.name), {
        id: `espn:${slug}:${athlete.espnId}`,
        name: athlete.name,
        team: team.abbreviation,
        teamName: team.name,
        position: athlete.position,
        headshotUrl: athlete.headshotUrl,
      });
    }
  }
  return identities;
}

function propRow(
  slug: SportSlug,
  prop: MappedPlayerPropMarket,
  athletes: Map<string, AthleteIdentity>,
) {
  const identity = athletes.get(normalizeName(prop.player.name));
  const player = identity ?? prop.player;
  const matchup = `${prop.opponent.away} @ ${prop.opponent.home}`;
  const opponent = identity
    ? normalizeName(identity.teamName) === normalizeName(prop.opponent.home)
      ? prop.opponent.away
      : normalizeName(identity.teamName) === normalizeName(prop.opponent.away)
        ? prop.opponent.home
        : matchup
    : matchup;
  const playerKey = normalizeName(prop.player.name);
  return {
    id: `${prop.gameId}:${prop.market}:${playerKey}`,
    game_id: prop.gameId,
    player: toJson(player),
    opponent,
    sport: slug.toUpperCase(),
    market: prop.market,
    book_odds: toJson(prop.bookOdds),
    recent_hit_rate: null,
    matchup_context: null,
    source: toJson({
      source: "The Odds API",
      retrievedAt: new Date().toISOString(),
      sport: slug.toUpperCase(),
      league: slug.toUpperCase(),
      eventId: prop.gameId,
      dataType: "fact",
      freshness: "live",
    } satisfies SourceMetadata),
    updated_at: new Date().toISOString(),
  };
}

async function syncPlayerProps(
  slug: SportSlug,
  games: MappedGame[],
  apiKey: string,
  supabase: ReturnType<typeof getSupabaseServerClient>,
): Promise<{ count: number; errors: string[] }> {
  const now = Date.now();
  const candidates = games
    .filter((game) => {
      const startsAt = new Date(game.startsAt).getTime();
      return startsAt >= now - 4 * 60 * 60 * 1000 && startsAt <= now + PROP_HORIZON_MS;
    })
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, PROP_EVENT_LIMIT);
  if (candidates.length === 0) return { count: 0, errors: [] };

  const athletes = await loadAthleteIdentities(supabase, slug, games[0]?.league ?? slug.toUpperCase());
  const settled = await Promise.allSettled(
    candidates.map((game) => fetchEventPlayerProps(slug, game.id, PROP_MARKETS[slug], apiKey)),
  );
  const errors: string[] = [];
  const props = settled.flatMap((result, index) => {
    if (result.status === "fulfilled") return result.value;
    errors.push(`${candidates[index].id}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
    return [];
  });
  const missingNames = Array.from(
    new Set(props.map((prop) => prop.player.name).filter((name) => !athletes.has(normalizeName(name)))),
  ).slice(0, 40);
  const expectedTeamsByPlayer = new Map<string, Set<string>>();
  for (const prop of props) {
    const key = normalizeName(prop.player.name);
    const teams = expectedTeamsByPlayer.get(key) ?? new Set<string>();
    teams.add(prop.opponent.away);
    teams.add(prop.opponent.home);
    expectedTeamsByPlayer.set(key, teams);
  }
  const searched = await Promise.allSettled(
    missingNames.map((name) => searchEspnAthlete(
      slug,
      name,
      Array.from(expectedTeamsByPlayer.get(normalizeName(name)) ?? []),
    )),
  );
  for (let index = 0; index < searched.length; index += 1) {
    const result = searched[index];
    if (result.status !== "fulfilled" || !result.value) continue;
    const athlete = result.value;
    athletes.set(normalizeName(missingNames[index]), {
      id: `espn:${slug}:${athlete.espnId}`,
      name: athlete.name,
      team: athlete.teamName ?? "",
      teamName: athlete.teamName ?? "",
      position: athlete.position,
      headshotUrl: athlete.headshotUrl,
    });
  }

  // Provider spelling can vary by punctuation/diacritics. Merge rows that
  // normalize to the same primary key before the Supabase upsert.
  const mergedProps = new Map<string, MappedPlayerPropMarket>();
  for (const prop of props) {
    if (prop.bookOdds.length === 0) continue;
    const rowId = `${prop.gameId}:${prop.market}:${normalizeName(prop.player.name)}`;
    const existing = mergedProps.get(rowId);
    if (existing) existing.bookOdds.push(...prop.bookOdds);
    else mergedProps.set(rowId, { ...prop, bookOdds: [...prop.bookOdds] });
  }
  const rows = Array.from(mergedProps.values()).map((prop) => propRow(slug, prop, athletes));

  for (let index = 0; index < rows.length; index += 200) {
    const { error } = await supabase.from("props").upsert(rows.slice(index, index + 200));
    if (error) throw error;
  }
  return { count: rows.length, errors };
}

function buildMovementRows(game: MappedGame, eventLabel: string): MovementRow[] {
  const rows: MovementRow[] = [];
  for (const book of game.bookOdds) {
    if (book.spread) {
      rows.push({
        id: movementId(game.id, "spread", book.sportsbook),
        event: eventLabel,
        market: `${game.homeTeam.abbreviation} spread`,
        sportsbook: book.sportsbook,
        opening_line: book.spread.line,
        current_line: book.spread.line,
        opening_price: book.spread.home,
        current_price: book.spread.home,
        direction: "flat",
        captured_at: book.capturedAt,
        source: game.source,
      });
    }
    if (book.total) {
      rows.push({
        id: movementId(game.id, "total", book.sportsbook),
        event: eventLabel,
        market: "Game total",
        sportsbook: book.sportsbook,
        opening_line: book.total.line,
        current_line: book.total.line,
        opening_price: book.total.over,
        current_price: book.total.over,
        direction: "flat",
        captured_at: book.capturedAt,
        source: game.source,
      });
    }
  }
  return rows;
}

async function syncGames(apiKey: string, supabase: ReturnType<typeof getSupabaseServerClient>) {
  const results: Record<string, { games: number; props: number; movements: number; signals: number; propErrors?: string[]; error?: string }> = {};

  for (const slug of SPORT_SLUGS) {
    try {
      // Resolve team identities through the canonical registry when it has
      // been seeded by the ESPN sync; a registry outage must not block the
      // market feed, so fall back to derived identities on failure.
      let registry: EspnTeamIdentityProvider | undefined;
      try {
        registry = await getTeamIdentityProvider(slug);
      } catch {
        registry = undefined;
      }
      const games = await fetchSportOdds(slug, apiKey, registry);

      if (games.length > 0) {
        const { error: gamesError } = await supabase.from("games").upsert(
          games.map((game) => ({
            id: game.id,
            sport_id: game.sport.id,
            league: game.league,
            home_team: toJson(game.homeTeam),
            away_team: toJson(game.awayTeam),
            starts_at: game.startsAt,
            status: game.status,
            book_odds: toJson(game.bookOdds),
            key_factors: [],
            source: toJson(game.source),
            updated_at: new Date().toISOString(),
          })),
        );
        if (gamesError) throw gamesError;
      }

      let movementCount = 0;
      let signalCount = 0;
      const propResult = await syncPlayerProps(slug, games, apiKey, supabase);

      for (const game of games) {
        const eventLabel = `${game.awayTeam.name} @ ${game.homeTeam.name}`;
        const candidateRows = buildMovementRows(game, eventLabel);
        if (candidateRows.length === 0) continue;

        const ids = candidateRows.map((r) => r.id);
        const { data: existingRows, error: fetchError } = await supabase
          .from("market_movements")
          .select("id, opening_line, opening_price, current_line, current_price")
          .in("id", ids);
        if (fetchError) throw fetchError;

        const existingById = new Map((existingRows ?? []).map((r) => [r.id, r]));

        const upsertRows = candidateRows.map((row) => {
          const existing = existingById.get(row.id);
          if (!existing) {
            return row;
          }
          const prevLine = existing.current_line ?? row.current_line;
          const direction: MovementRow["direction"] =
            row.current_line === null || prevLine === null
              ? "flat"
              : row.current_line > prevLine
                ? "up"
                : row.current_line < prevLine
                  ? "down"
                  : "flat";
          return {
            ...row,
            opening_line: existing.opening_line,
            opening_price: existing.opening_price,
            direction,
          };
        });

        const { error: upsertError } = await supabase
          .from("market_movements")
          .upsert(upsertRows.map((row) => ({ ...row, source: toJson(row.source) })));
        if (upsertError) throw upsertError;
        movementCount += upsertRows.length;

        // Signals: for the game total, compute a no-vig consensus fair
        // probability of "Over" across every book quoting it this sync, then
        // compare each individual book's own price against that consensus.
        // This is the RSA EDGE MODEL v0.1 methodology (lib/models/edgeCalculator.ts)
        // applied cross-sectionally across books — it is purely a function of
        // odds fetched this sync, not a fabricated "expert consensus" figure.
        const totalBooks = game.bookOdds.filter((b) => b.total);
        const consensusOverFair =
          totalBooks.length > 0
            ? computeConsensusProbability(
                totalBooks.map((b) => devigTwoWay(b.total!.over, b.total!.under).probabilityA),
              )
            : null;

        for (const book of game.bookOdds) {
          if (!book.total || consensusOverFair === null) continue;
          const movementRow = upsertRows.find(
            (r) => r.market === "Game total" && r.sportsbook === book.sportsbook,
          );
          if (!movementRow) continue;

          const thisBookImplied = americanToImpliedProbability(book.total.over);
          const delta = computeEdge(consensusOverFair, thisBookImplied);

          const { error: signalError } = await supabase.from("signals").upsert({
            id: `${movementId(game.id, "total", book.sportsbook)}-signal`,
            event: eventLabel,
            market: "Total",
            movement: toJson({
              direction: movementRow.direction,
              openLine: movementRow.opening_line,
              currentLine: movementRow.current_line,
              // No bettor-consensus/handle data source is connected yet;
              // this intentionally does NOT claim a betting-public percentage.
              consensus: "N/A — no bettor consensus/handle data source connected",
            }),
            model_market_delta: Math.round(delta * 1000) / 1000,
            note: `Total line ${movementRow.direction === "flat" ? "unchanged" : movementRow.direction === "up" ? "moved up" : "moved down"} at ${book.sportsbook} since last sync.`,
            updated_at: new Date().toISOString(),
          });
          if (signalError) throw signalError;
          signalCount += 1;
        }
      }

      results[slug] = {
        games: games.length,
        props: propResult.count,
        movements: movementCount,
        signals: signalCount,
        ...(propResult.errors.length > 0 ? { propErrors: propResult.errors } : {}),
      };
    } catch (error) {
      results[slug] = {
        games: 0,
        props: 0,
        movements: 0,
        signals: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return results;
}

async function handleSync(request: NextRequest) {
  const unauthorized = authorizeCronRequest(request);
  if (unauthorized) return unauthorized;

  const env = getEnv();
  const supabase = getSupabaseServerClient();
  const results = await syncGames(env.ODDS_API_KEY, supabase);

  return NextResponse.json({ data: results, syncedAt: new Date().toISOString() });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
