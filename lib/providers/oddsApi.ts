import "server-only";
import type { Game, GameStatus, Player, PlayerProp, SourceMetadata, Sport, Team, TeamRegistryEntry } from "@/types";
import { sports } from "@/lib/data/sports";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

export const ODDS_API_SPORT_KEYS = {
  nfl: "americanfootball_nfl",
  ncaaf: "americanfootball_ncaaf",
  nba: "basketball_nba",
  wnba: "basketball_wnba",
  mlb: "baseball_mlb",
  nhl: "icehockey_nhl",
} as const;

type SportSlug = keyof typeof ODDS_API_SPORT_KEYS;

// The Odds API's raw response shapes (subset of fields we use).
interface OddsApiOutcome {
  name: string;
  description?: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: "h2h" | "spreads" | "totals" | string;
  last_update?: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface BookOddsSnapshot {
  sportsbook: string;
  capturedAt: string;
  moneyline?: { home: number; away: number };
  spread?: { home: number; away: number; line: number };
  total?: { line: number; over: number; under: number };
}

export interface MappedGame {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  startsAt: string;
  status: GameStatus;
  bookOdds: BookOddsSnapshot[];
  source: SourceMetadata;
}

function assertApiKey(apiKey: string | undefined): string {
  if (!apiKey) {
    throw new Error("ODDS_API_KEY is required to call The Odds API");
  }
  return apiKey;
}

// The Odds API does not return league abbreviations or W-L records; we derive
// a short code from the team name purely so the UI has something to render,
// and it is NOT the league's official abbreviation. `record` is left unset
// rather than guessed.
function deriveAbbreviation(teamName: string): string {
  const initials = teamName
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return initials.slice(-3) || teamName.slice(0, 3).toUpperCase();
}

// The Odds API identifies teams by display name only. When a team registry
// seeded from ESPN is available (lib/data/teamRegistry.ts), the provider
// resolves each name to the canonical registry entry so games join cleanly
// with ESPN facts; without a registry it falls back to the derived identity.
export interface EspnTeamIdentityProvider {
  resolve(name: string): TeamRegistryEntry | undefined;
}

function fallbackTeamId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function toTeam(name: string, registry?: EspnTeamIdentityProvider): Team {
  const entry = registry?.resolve(name);
  if (entry) {
    return {
      id: entry.id,
      name: entry.name,
      abbreviation: entry.abbreviation,
      logoUrl: entry.logoUrl,
    };
  }
  return {
    id: fallbackTeamId(name),
    name,
    abbreviation: deriveAbbreviation(name),
  };
}

/** Adapter: builds the identity-provider seam from a registry lookup function. */
export function buildTeamIdentityProvider(
  resolve: (name: string) => TeamRegistryEntry | undefined,
): EspnTeamIdentityProvider {
  return { resolve };
}

function toGameStatus(commenceTime: string): GameStatus {
  return new Date(commenceTime).getTime() <= Date.now() ? "live" : "scheduled";
}

function extractBookOdds(bookmaker: OddsApiBookmaker, homeTeam: string, awayTeam: string): BookOddsSnapshot {
  const snapshot: BookOddsSnapshot = {
    sportsbook: bookmaker.title,
    capturedAt: bookmaker.last_update,
  };

  const h2h = bookmaker.markets.find((m) => m.key === "h2h");
  if (h2h) {
    const home = h2h.outcomes.find((o) => o.name === homeTeam);
    const away = h2h.outcomes.find((o) => o.name === awayTeam);
    if (home && away) {
      snapshot.moneyline = { home: home.price, away: away.price };
    }
  }

  const spreads = bookmaker.markets.find((m) => m.key === "spreads");
  if (spreads) {
    const home = spreads.outcomes.find((o) => o.name === homeTeam);
    const away = spreads.outcomes.find((o) => o.name === awayTeam);
    if (home && away && typeof home.point === "number" && typeof away.point === "number") {
      snapshot.spread = { home: home.price, away: away.price, line: home.point };
    }
  }

  const totals = bookmaker.markets.find((m) => m.key === "totals");
  if (totals) {
    const over = totals.outcomes.find((o) => o.name === "Over");
    const under = totals.outcomes.find((o) => o.name === "Under");
    if (over && under && typeof over.point === "number") {
      snapshot.total = { line: over.point, over: over.price, under: under.price };
    }
  }

  return snapshot;
}

function mapEventToGame(event: OddsApiEvent, sport: Sport, registry?: EspnTeamIdentityProvider): MappedGame {
  return {
    id: event.id,
    sport,
    league: sport.name,
    homeTeam: toTeam(event.home_team, registry),
    awayTeam: toTeam(event.away_team, registry),
    startsAt: event.commence_time,
    status: toGameStatus(event.commence_time),
    bookOdds: event.bookmakers.map((b) => extractBookOdds(b, event.home_team, event.away_team)),
    source: {
      source: "The Odds API",
      retrievedAt: new Date().toISOString(),
      sport: sport.name,
      league: sport.name,
      eventId: event.id,
      dataType: "fact",
      freshness: "live",
    },
  };
}

/**
 * Fetches moneyline/spread/totals odds for one sport across all bookmakers
 * The Odds API returns for the `us` region, and maps each event into our
 * internal shape. Player-prop markets are NOT included here — The Odds API
 * requires a separate per-event call (see fetchEventPlayerProps) and the
 * available prop market keys vary by sport and by plan tier, so callers
 * should pass the market keys their account actually has access to.
 *
 * `registry` is optional: when the caller has already loaded the canonical
 * team registry (lib/data/teamRegistry.ts), team identities resolve through
 * it so the resulting games join cleanly with ESPN-sourced facts.
 */
export async function fetchSportOdds(
  sportSlug: SportSlug,
  apiKey: string | undefined,
  registry?: EspnTeamIdentityProvider,
): Promise<MappedGame[]> {
  const key = assertApiKey(apiKey);
  const sport = sports.find((s) => s.slug === sportSlug);
  if (!sport) {
    throw new Error(`Unknown sport slug: ${sportSlug}`);
  }

  const sportKey = ODDS_API_SPORT_KEYS[sportSlug];
  const url = new URL(`${ODDS_API_BASE}/sports/${sportKey}/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", "h2h,spreads,totals");
  url.searchParams.set("oddsFormat", "american");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`The Odds API request failed (${response.status}): ${await response.text()}`);
  }

  const events: OddsApiEvent[] = await response.json();
  return events.map((event) => mapEventToGame(event, sport, registry));
}

export interface MappedPlayerPropMarket {
  gameId: string;
  sport: string;
  player: Player;
  opponent: { home: string; away: string };
  market: string;
  bookOdds: { sportsbook: string; line: number; overOdds: number; underOdds: number; capturedAt: string }[];
}

/**
 * Fetches player-prop odds for one already-known event. Requires the exact
 * Odds API market keys for the props you want (e.g. "player_points" for
 * NBA), which depend on your plan tier — see
 * https://the-odds-api.com/sports-odds-data/betting-markets.html.
 */
export async function fetchEventPlayerProps(
  sportSlug: SportSlug,
  eventId: string,
  marketKeys: string[],
  apiKey: string | undefined,
): Promise<MappedPlayerPropMarket[]> {
  const key = assertApiKey(apiKey);
  if (marketKeys.length === 0) return [];

  const sportKey = ODDS_API_SPORT_KEYS[sportSlug];
  const url = new URL(`${ODDS_API_BASE}/sports/${sportKey}/events/${eventId}/odds`);
  url.searchParams.set("apiKey", key);
  url.searchParams.set("regions", "us");
  url.searchParams.set("markets", marketKeys.join(","));
  url.searchParams.set("oddsFormat", "american");

  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`The Odds API player-props request failed (${response.status}): ${await response.text()}`);
  }

  const event: OddsApiEvent = await response.json();
  const byMarket = new Map<string, MappedPlayerPropMarket>();

  for (const bookmaker of event.bookmakers) {
    for (const market of bookmaker.markets) {
      if (!marketKeys.includes(market.key)) continue;

      const outcomesByPlayer = new Map<string, OddsApiOutcome[]>();
      for (const outcome of market.outcomes) {
        const playerName = outcome.description?.trim();
        if (!playerName) continue;
        const current = outcomesByPlayer.get(playerName) ?? [];
        current.push(outcome);
        outcomesByPlayer.set(playerName, current);
      }

      for (const [playerName, outcomes] of outcomesByPlayer) {
        const over = outcomes.find((outcome) => outcome.name.toLowerCase() === "over");
        const under = outcomes.find((outcome) => outcome.name.toLowerCase() === "under");
        if (!over || !under || typeof over.point !== "number") continue;

        const playerSlug = playerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const mapKey = `${market.key}:${playerSlug}`;
        const existing = byMarket.get(mapKey);
        const entry: MappedPlayerPropMarket = existing ?? {
          gameId: event.id,
          sport: event.sport_title,
          player: {
            id: `oddsapi:${sportSlug}:${playerSlug}`,
            name: playerName,
            team: "",
          },
          opponent: { home: event.home_team, away: event.away_team },
          market: market.key,
          bookOdds: [],
        };
        entry.bookOdds.push({
          sportsbook: bookmaker.title,
          line: over.point,
          overOdds: over.price,
          underOdds: under.price,
          capturedAt: market.last_update ?? bookmaker.last_update,
        });
        byMarket.set(mapKey, entry);
      }
    }
  }

  return Array.from(byMarket.values());
}

export type { Player, PlayerProp, Game };
