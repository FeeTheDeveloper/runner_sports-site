import "server-only";
import type {
  EspnAthleteProfile,
  EspnAthleteStatCategory,
  EspnEventOdds,
  EspnGameLogEntry,
  EspnInjuryEntry,
  EspnLeagueTeam,
  EspnNewsArticle,
  EspnPlayByPlayData,
  EspnPowerIndexEntry,
  EspnPredictorData,
  EspnRecordDataType,
  EspnRecordRow,
  EspnRosterAthlete,
  EspnScoreboardEvent,
  EspnSportSlug,
  EspnStandingEntry,
  EspnSummaryData,
  EspnWinProbabilityPoint,
  GameStatus,
  SourceMetadata,
} from "@/types";
import { sports } from "@/lib/data/sports";

// ESPN's endpoints are unofficial and undocumented: they may change shape or
// availability without notice, and no rate limits are published. Every fetch
// therefore goes through one guarded path (timeout + in-memory cache +
// retry-with-backoff for transient failures), every normalizer treats every
// field as optional, and call sites decide per endpoint whether a failure is
// hard (whole payload unusable) or soft (one section degrades while the rest
// of the response is still used).

const ESPN_SITE_BASE = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_WEB_BASE = "https://site.web.api.espn.com/apis/fitt/v3/sports";

export const ESPN_SPORT_PATHS: Record<EspnSportSlug, string> = {
  nfl: "football/nfl",
  nba: "basketball/nba",
  mlb: "baseball/mlb",
  nhl: "hockey/nhl",
};

export const ESPN_PROVIDER = "ESPN";

export class EspnApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "EspnApiError";
    this.status = status;
  }

  // 4xx means the endpoint/shape itself is wrong for us — retrying the same
  // request cannot help, so callers should not back off, just degrade.
  get isPermanent(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
}

type JsonObject = Record<string, unknown>;

interface EspnRequestOptions {
  /** Subpath appended to the sport's site-api base, e.g. "scoreboard". */
  path?: string;
  params?: Record<string, string>;
  /** Absolute URL for endpoints that do not follow the site-api sport path (league news). */
  url?: string;
  cacheTtlMs?: number;
  /** Extra retry attempts for transient failures (timeouts, 5xx, network). */
  retries?: number;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const RETRY_BASE_DELAY_MS = 1_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Process-local cache so a single server instance reuses ESPN responses
// across requests within the caller-specified freshness window. Entries are
// swept on write so a long-lived instance cannot grow it without bound.
const responseCache = new Map<string, { expiresAt: number; payload: JsonObject }>();
const MAX_CACHE_ENTRIES = 500;

function readCache(key: string): JsonObject | undefined {
  const entry = responseCache.get(key);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) {
    responseCache.delete(key);
    return undefined;
  }
  return entry.payload;
}

function writeCache(key: string, payload: JsonObject, ttlMs: number) {
  if (ttlMs <= 0) return;
  if (responseCache.size >= MAX_CACHE_ENTRIES) {
    const now = Date.now();
    for (const [k, entry] of responseCache) {
      if (entry.expiresAt <= now) responseCache.delete(k);
    }
  }
  responseCache.set(key, { expiresAt: Date.now() + ttlMs, payload });
}

/** Test/maintenance hook: clears the in-memory ESPN response cache. */
export function clearEspnCache() {
  responseCache.clear();
}

async function fetchEspnRaw(options: EspnRequestOptions): Promise<JsonObject> {
  if (!options.url) {
    throw new EspnApiError("fetchEspnRaw requires either a path (via espnRequest) or an absolute url");
  }
  const url = new URL(options.url);
  for (const [key, value] of Object.entries(options.params ?? {})) {
    url.searchParams.set(key, value);
  }

  const cacheKey = url.toString();
  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  const attempts = 1 + (options.retries ?? 1);
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { "user-agent": "runner-sports-site/1.0 (https://runnersportsanalytics.com)" },
      });
      if (!response.ok) {
        const error = new EspnApiError(`ESPN request failed (${response.status}) for ${url.pathname}`, response.status);
        if (error.isPermanent) throw error;
        lastError = error;
      } else {
        const payload = (await response.json()) as JsonObject;
        writeCache(cacheKey, payload, options.cacheTtlMs ?? 0);
        return payload;
      }
    } catch (error) {
      if (error instanceof EspnApiError && error.isPermanent) throw error;
      lastError = error instanceof Error && error.name === "AbortError"
        ? new EspnApiError(`ESPN request timed out after ${DEFAULT_TIMEOUT_MS}ms for ${url.pathname}`)
        : error;
    } finally {
      clearTimeout(timeout);
    }

    if (attempt < attempts - 1) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt);
    }
  }

  throw lastError instanceof EspnApiError
    ? lastError
    : new EspnApiError(`ESPN request failed for ${url.pathname}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}

async function espnRequest(sport: EspnSportSlug, path: string, options: Omit<EspnRequestOptions, "path" | "url"> = {}) {
  return fetchEspnRaw({
    ...options,
    url: `${ESPN_SITE_BASE}/${ESPN_SPORT_PATHS[sport]}/${path.replace(/^\/+/, "")}`,
  });
}

function sportLeague(sport: EspnSportSlug) {
  const meta = sports.find((s) => s.slug === sport);
  if (!meta) throw new Error(`Unknown sport slug: ${sport}`);
  return meta;
}

// ---------- response guards ----------
// ESPN payloads are untyped external data; these helpers keep every
// normalizer defensive without scattering `any` across the module.

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonObject | undefined {
  return isRecord(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function pickRefId(...values: unknown[]): string | undefined {
  for (const value of values) {
    const id = asString(value);
    if (id) return id;
  }
  return undefined;
}

function competitionOf(event: JsonObject): JsonObject | undefined {
  return asRecord(asArray(event.competitions)[0]);
}

function statusOf(container: JsonObject | undefined): JsonObject | undefined {
  return asRecord(container?.status);
}

// ---------- normalizers ----------

export function toEspnGameStatus(statusType: unknown, startsAt?: string): GameStatus {
  const state = asString(asRecord(statusType)?.state);
  if (state === "pre") return "scheduled";
  if (state === "in") return "live";
  if (state === "post") return "final";
  // Unrecognized status vocabulary — fall back to the clock rather than
  // trusting an unknown label, per the fail-soft posture.
  return startsAt && new Date(startsAt).getTime() <= Date.now() ? "live" : "scheduled";
}

function toEventOdds(raw: unknown): EspnEventOdds | undefined {
  const odds = asRecord(raw);
  if (!odds) return undefined;
  const provider = asString(asRecord(odds.provider)?.name);
  const normalized: EspnEventOdds = {
    provider,
    details: asString(odds.details),
    overUnder: asNumber(odds.overUnder),
    homeMoneyline: asNumber(odds.homeMoneyline),
    awayMoneyline: asNumber(odds.awayMoneyline),
  };
  return provider || normalized.details || normalized.overUnder !== undefined ||
      normalized.homeMoneyline !== undefined || normalized.awayMoneyline !== undefined
    ? normalized
    : undefined;
}

function eventOddsFromCompetition(competition: JsonObject | undefined): EspnEventOdds | undefined {
  const oddsList = asArray(competition?.odds);
  return toEventOdds(oddsList[0]);
}

function mapEvent(event: JsonObject): EspnScoreboardEvent | undefined {
  const eventId = asString(event.id);
  const name = asString(event.name) ?? asString(event.shortName);
  const competition = competitionOf(event);
  const startsAt = asString(event.date) ?? asString(competition?.date);
  if (!eventId || !name || !startsAt) return undefined;

  const competitors: EspnScoreboardEvent["competitors"] = [];
  for (const raw of asArray(competition?.competitors)) {
    const competitor = asRecord(raw);
    const team = asRecord(competitor?.team);
    const teamId = pickRefId(team?.id, team?.uid);
    const teamName = asString(team?.displayName) ?? asString(team?.name);
    const homeAway = asString(competitor?.homeAway);
    if (!teamId || !teamName || (homeAway !== "home" && homeAway !== "away")) continue;
    const records = asArray(competitor?.records).map(asRecord);
    const recordSummary = asString(records.find((r) => r && asString(r.summary))?.summary);
    competitors.push({
      teamId,
      teamName,
      teamAbbreviation: asString(team?.abbreviation),
      homeAway,
      score: asNumber(competitor?.score),
      winner: competitor?.winner === true ? true : undefined,
      record: recordSummary,
    });
  }

  const broadcasts = asArray(competition?.broadcasts)
    .flatMap((b) => asArray(asRecord(b)?.names))
    .map(asString)
    .filter((n): n is string => Boolean(n));

  const statusType = asRecord(statusOf(competition)?.type) ?? asRecord(statusOf(event)?.type);

  return {
    eventId,
    name,
    shortName: asString(event.shortName),
    startsAt,
    status: toEspnGameStatus(statusType, startsAt),
    statusDetail: asString(asRecord(statusType)?.shortDetail) ?? asString(asRecord(statusType)?.detail),
    venue: asString(asRecord(competition?.venue)?.fullName),
    competitors,
    broadcasts,
    espnOdds: eventOddsFromCompetition(competition),
  };
}

function mapLeagueTeam(raw: unknown): EspnLeagueTeam | undefined {
  // The /teams listing wraps each entry as { team: {...} }; the summary
  // endpoint's header uses bare competitor team objects instead.
  const container = asRecord(raw);
  const team = asRecord(container?.team) ?? container;
  const espnId = pickRefId(team?.id, team?.uid);
  const name = asString(team?.displayName) ?? asString(team?.name);
  if (!espnId || !name) return undefined;
  const logoUrl = asString(team?.logo) ?? asString(asArray(team?.logos).map(asRecord)[0]?.href);
  return {
    espnId,
    name,
    abbreviation: asString(team?.abbreviation),
    displayName: asString(team?.displayName),
    location: asString(team?.location),
    logoUrl,
  };
}

function mapRosterAthlete(raw: unknown): EspnRosterAthlete | undefined {
  // Roster entries arrive either as bare athlete objects or wrapped as
  // { athlete: {...}, ... } depending on the endpoint version.
  const entry = asRecord(raw);
  const athlete = asRecord(entry?.athlete) ?? entry;
  const espnId = pickRefId(athlete?.id, athlete?.uid);
  const name = asString(athlete?.displayName) ?? asString(athlete?.fullName);
  if (!espnId || !name) return undefined;
  return {
    espnId,
    name,
    jersey: asString(athlete?.jersey),
    position: asString(asRecord(athlete?.position)?.abbreviation),
    height: asString(athlete?.displayHeight),
    weight: asNumber(athlete?.displayWeight ?? athlete?.weight),
    age: asNumber(athlete?.age),
  };
}

function mapInjury(teamId: string | undefined, teamName: string | undefined, raw: unknown): EspnInjuryEntry | undefined {
  const injury = asRecord(raw);
  if (!injury) return undefined;
  const athlete = asRecord(injury.athlete);
  const athleteName = asString(athlete?.displayName) ?? asString(injury.athleteName);
  if (!athleteName) return undefined;
  const type = asRecord(injury.type);
  return {
    teamId: teamId ?? "unknown",
    teamName: teamName ?? asString(asRecord(athlete?.team)?.displayName) ?? "unknown",
    athleteId: pickRefId(athlete?.id, athlete?.uid),
    athleteName,
    position: asString(asRecord(athlete?.position)?.abbreviation),
    status: asString(injury.status) ?? asString(type?.description),
    detail: asString(injury.details) && asString(asRecord(injury.details)?.detail)
      ? asString(asRecord(injury.details)?.detail)
      : asString(type?.detail),
  };
}

function statValue(stats: JsonObject[], ...names: string[]): number | undefined {
  for (const name of names) {
    const entry = stats.find((s) => asString(s.name) === name);
    const value = asNumber(entry?.value) ?? asNumber(entry?.displayValue);
    if (value !== undefined) return value;
  }
  return undefined;
}

function statDisplay(stats: JsonObject[], ...names: string[]): string | undefined {
  for (const name of names) {
    const entry = stats.find((s) => asString(s.name) === name);
    const value = asString(entry?.displayValue) ?? asString(entry?.value);
    if (value !== undefined) return value;
  }
  return undefined;
}

function mapStandingEntry(raw: unknown): EspnStandingEntry | undefined {
  const entry = asRecord(raw);
  const team = asRecord(entry?.team);
  const teamId = pickRefId(team?.id, team?.uid);
  const teamName = asString(team?.displayName) ?? asString(team?.name);
  if (!teamId || !teamName) return undefined;
  const stats = asArray(entry?.stats).map(asRecord).filter((s): s is JsonObject => Boolean(s));
  return {
    teamId,
    teamName,
    abbreviation: asString(team?.abbreviation),
    wins: statValue(stats, "wins", "overallWins"),
    losses: statValue(stats, "losses", "overallLosses"),
    ties: statValue(stats, "ties"),
    winPercent: statValue(stats, "winPercent", "winPercentage"),
    gamesBehind: statDisplay(stats, "gamesBehind"),
    streak: statDisplay(stats, "streak"),
    playoffSeed: statValue(stats, "playoffSeed"),
  };
}

function mapPlayByPlay(raw: unknown): EspnPlayByPlayData | undefined {
  const plays = asArray(raw)
    .map(asRecord)
    .map((play): EspnPlayByPlayData["plays"][number] | undefined => {
      const id = asString(play?.id);
      const text = asString(play?.text) ?? asString(play?.shortText);
      if (!id || !text) return undefined;
      return {
        id,
        period: asNumber(asRecord(play?.period)?.number),
        clock: asString(asRecord(play?.clock)?.displayValue),
        text,
        teamId: pickRefId(asRecord(play?.team)?.id),
        scoringPlay: play?.scoringPlay === true,
      };
    })
    .filter((p): p is EspnPlayByPlayData["plays"][number] => Boolean(p));
  if (plays.length === 0) return undefined;
  const periods = plays.reduce((max, p) => Math.max(max, p.period ?? 0), 0);
  return { periods, plays };
}

function mapWinProbability(raw: unknown): EspnWinProbabilityPoint[] | undefined {
  const points = asArray(raw)
    .map(asRecord)
    .map((point): EspnWinProbabilityPoint | undefined => {
      const homeWinPercentage = asNumber(point?.homeWinPercentage);
      if (homeWinPercentage === undefined) return undefined;
      return {
        playId: asString(point?.playId),
        period: asNumber(asRecord(point?.period)?.number),
        clock: asString(asRecord(point?.clock)?.displayValue),
        homeWinPercentage,
        tiePercentage: asNumber(point?.tiePercentage),
      };
    })
    .filter((p): p is EspnWinProbabilityPoint => Boolean(p));
  return points.length > 0 ? points : undefined;
}

function mapPredictor(raw: unknown): EspnPredictorData | undefined {
  const predictor = asRecord(raw);
  if (!predictor) return undefined;
  const home = asNumber(asRecord(predictor.homeTeam)?.gameProjection);
  const away = asNumber(asRecord(predictor.awayTeam)?.gameProjection);
  if (home === undefined && away === undefined) return undefined;
  return { homeWinPercentage: home, awayWinPercentage: away };
}

function mapPowerIndex(raw: unknown): EspnPowerIndexEntry[] | undefined {
  const entries = asArray(raw)
    .map(asRecord)
    .map((entry): EspnPowerIndexEntry | undefined => {
      const team = asRecord(entry?.team);
      const teamId = pickRefId(team?.id, team?.uid);
      const teamName = asString(team?.displayName) ?? asString(team?.name);
      if (!teamId || !teamName) return undefined;
      const values: Record<string, string> = {};
      const categories = asArray(entry?.categories);
      for (const category of categories.map(asRecord)) {
        for (const stat of asArray(category?.values).map(asRecord)) {
          const statName = asString(stat?.name);
          const statValueDisplay = asString(stat?.displayValue) ?? asString(stat?.value);
          if (statName && statValueDisplay !== undefined) values[statName] = statValueDisplay;
        }
      }
      return {
        teamId,
        teamName,
        metricName: asString(entry?.metricName) ?? "powerindex",
        values,
      };
    })
    .filter((e): e is EspnPowerIndexEntry => Boolean(e));
  return entries.length > 0 ? entries : undefined;
}

function mapSummaryInjuries(raw: unknown): EspnInjuryEntry[] | undefined {
  const injuries = asArray(raw)
    .flatMap((teamBlock) => {
      const block = asRecord(teamBlock);
      const team = asRecord(block?.team);
      return asArray(block?.injuries).map((injury) =>
        mapInjury(pickRefId(team?.id, team?.uid), asString(team?.displayName), injury),
      );
    })
    .filter((i): i is EspnInjuryEntry => Boolean(i));
  return injuries.length > 0 ? injuries : undefined;
}

function mapNewsArticle(raw: unknown): EspnNewsArticle | undefined {
  const article = asRecord(raw);
  const id = asString(article?.id);
  const headline = asString(article?.headline);
  if (!id || !headline) return undefined;
  const links = asRecord(article?.links);
  return {
    id,
    headline,
    description: asString(article?.description),
    publishedAt: asString(article?.published),
    link: asString(asRecord(links?.web)?.href) ?? asString(article?.link),
  };
}

// ---------- record envelope ----------

function buildRecord(
  sport: EspnSportSlug,
  dataType: EspnRecordDataType,
  entityId: string,
  payload: unknown,
  retrievedAt: string,
  eventId?: string,
): EspnRecordRow {
  const league = sportLeague(sport).name;
  const source: SourceMetadata = {
    source: ESPN_PROVIDER,
    retrievedAt,
    sport: league,
    league,
    dataType: "fact",
    freshness: "live",
    ...(eventId ? { eventId } : {}),
  };
  return {
    id: `espn:${sport}:${dataType}:${entityId}`,
    provider: ESPN_PROVIDER,
    sport,
    league,
    dataType,
    entityId,
    payload,
    retrievedAt,
    source,
  };
}

// ---------- public fetchers ----------
// Hard-fail fetchers throw EspnApiError; soft-fail fetchers resolve to
// `undefined`/empty so one broken ESPN section never sinks the rest of a
// job. The JSDoc on each function states which contract it follows.

const SCOREBOARD_CACHE_TTL_MS = 5 * 60 * 1000;
const TEAMS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const ROSTER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const INJURIES_CACHE_TTL_MS = 60 * 60 * 1000;
const STANDINGS_CACHE_TTL_MS = 30 * 60 * 1000;
const ATHLETE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const NEWS_CACHE_TTL_MS = 30 * 60 * 1000;

/** Scoreboard (schedule + live scores + ESPN's own odds line) for one sport. Soft-fail: returns [] on error. */
export async function fetchScoreboard(sport: EspnSportSlug, dates?: string): Promise<EspnScoreboardEvent[]> {
  try {
    const payload = await espnRequest(sport, "scoreboard", {
      params: dates ? { dates } : {},
      cacheTtlMs: SCOREBOARD_CACHE_TTL_MS,
    });
    return asArray(payload.events)
      .map(asRecord)
      .map((event) => (event ? mapEvent(event) : undefined))
      .filter((e): e is EspnScoreboardEvent => Boolean(e));
  } catch {
    return [];
  }
}

/** League team listing (canonical ESPN team facts). Soft-fail: returns [] on error. */
export async function fetchTeams(sport: EspnSportSlug): Promise<EspnLeagueTeam[]> {
  try {
    const payload = await espnRequest(sport, "teams", { cacheTtlMs: TEAMS_CACHE_TTL_MS });
    const leagues = asArray(asRecord(asArray(payload.sports)[0])?.leagues).map(asRecord);
    return leagues
      .flatMap((league) => asArray(league?.teams))
      .map(mapLeagueTeam)
      .filter((t): t is EspnLeagueTeam => Boolean(t));
  } catch {
    return [];
  }
}

/** One team's facts by ESPN team id. Hard-fail: throws EspnApiError on error. */
export async function fetchTeam(sport: EspnSportSlug, teamId: string): Promise<EspnLeagueTeam | undefined> {
  const payload = await espnRequest(sport, `teams/${teamId}`, { cacheTtlMs: TEAMS_CACHE_TTL_MS });
  return mapLeagueTeam(asRecord(payload.team) ?? payload);
}

/** Team roster. Soft-fail: returns [] on error. */
export async function fetchRoster(sport: EspnSportSlug, teamId: string): Promise<EspnRosterAthlete[]> {
  try {
    const payload = await espnRequest(sport, `teams/${teamId}/roster`, { cacheTtlMs: ROSTER_CACHE_TTL_MS });
    return asArray(payload.athletes).map(mapRosterAthlete).filter((a): a is EspnRosterAthlete => Boolean(a));
  } catch {
    return [];
  }
}

/** League-wide injuries. Soft-fail: returns [] on error. */
export async function fetchInjuries(sport: EspnSportSlug): Promise<EspnInjuryEntry[]> {
  try {
    const payload = await espnRequest(sport, "injuries", { cacheTtlMs: INJURIES_CACHE_TTL_MS });
    return asArray(payload.injuries)
      .flatMap((teamBlock) => {
        const block = asRecord(teamBlock);
        const team = asRecord(block?.team);
        return asArray(block?.injuries).map((injury) =>
          mapInjury(pickRefId(team?.id, team?.uid), asString(team?.displayName), injury),
        );
      })
      .filter((i): i is EspnInjuryEntry => Boolean(i));
  } catch {
    return [];
  }
}

/** League standings. Soft-fail: returns [] on error. */
export async function fetchStandings(sport: EspnSportSlug): Promise<EspnStandingEntry[]> {
  try {
    const payload = await espnRequest(sport, "standings", { cacheTtlMs: STANDINGS_CACHE_TTL_MS });
    const entries: EspnStandingEntry[] = [];
    for (const child of asArray(payload.children)) {
      const group = asRecord(child);
      const groupName = asString(group?.name);
      for (const entry of asArray(asRecord(group?.standings)?.entries)) {
        const mapped = mapStandingEntry(entry);
        if (!mapped) continue;
        entries.push(groupName ? { ...mapped, group: groupName } : mapped);
      }
    }
    return entries;
  } catch {
    return [];
  }
}

/** Athlete profile. Hard-fail: throws EspnApiError on error. */
export async function fetchAthlete(sport: EspnSportSlug, athleteId: string): Promise<EspnAthleteProfile | undefined> {
  const payload = await espnRequest(sport, `athletes/${athleteId}`, { cacheTtlMs: ATHLETE_CACHE_TTL_MS });
  const athlete = asRecord(payload.athlete) ?? payload;
  const espnId = pickRefId(athlete.id, athlete.uid);
  const name = asString(athlete.displayName) ?? asString(athlete.fullName);
  if (!espnId || !name) return undefined;
  return {
    espnId,
    name,
    teamId: pickRefId(asRecord(athlete.team)?.id),
    position: asString(asRecord(athlete.position)?.abbreviation),
    jersey: asString(athlete.jersey),
    height: asString(athlete.displayHeight),
    weight: asNumber(athlete.displayWeight ?? athlete.weight),
    age: asNumber(athlete.age),
    headshotUrl: asString(asRecord(athlete.headshot)?.href),
  };
}

/** Athlete season statistics, grouped by ESPN's own category names. Soft-fail: returns [] on error. */
export async function fetchAthleteStats(sport: EspnSportSlug, athleteId: string): Promise<EspnAthleteStatCategory[]> {
  try {
    const payload = await espnRequest(sport, `athletes/${athleteId}/stats`, { cacheTtlMs: ATHLETE_CACHE_TTL_MS });
    return asArray(payload.categories)
      .map(asRecord)
      .map((category): EspnAthleteStatCategory | undefined => {
        const name = asString(category?.name);
        if (!name) return undefined;
        const stats = asArray(category?.stats)
          .map(asRecord)
          .map((stat) => {
            const statName = asString(stat?.name);
            const value = asString(stat?.displayValue) ?? asString(stat?.value);
            return statName && value !== undefined ? { name: statName, value } : undefined;
          })
          .filter((s): s is { name: string; value: string } => Boolean(s));
        return { name, stats };
      })
      .filter((c): c is EspnAthleteStatCategory => Boolean(c));
  } catch {
    return [];
  }
}

/** Athlete game log. Soft-fail: returns [] on error. */
export async function fetchAthleteGameLog(sport: EspnSportSlug, athleteId: string): Promise<EspnGameLogEntry[]> {
  try {
    const payload = await espnRequest(sport, `athletes/${athleteId}/gamelog`, { cacheTtlMs: ATHLETE_CACHE_TTL_MS });
    // Game log categories may live at the top level or one level down under
    // seasonTypes, depending on the sport — read both.
    const topLevel = asArray(payload.categories).map(asRecord);
    const nested = asArray(payload.seasonTypes)
      .map(asRecord)
      .flatMap((seasonType) => asArray(seasonType?.categories).map(asRecord));
    const eventsIndex = asRecord(payload.events) ?? {};

    return [...topLevel, ...nested]
      .filter((cat): cat is JsonObject => Boolean(cat))
      .flatMap((cat) => {
        const labels = asArray(cat.names).map(asString);
        return asArray(cat.events).map((eventEntry): EspnGameLogEntry | undefined => {
          const entry = asRecord(eventEntry);
          if (!entry) return undefined;
          const gameId = asString(entry.eventId) ?? asString(entry.id);
          const eventMeta = asRecord(gameId ? eventsIndex[gameId] : undefined);
          const opponent = asRecord(eventMeta?.opponent);
          const stats: Record<string, string> = {};
          asArray(entry.stats).forEach((value, index) => {
            const label = labels[index];
            const display = asString(value);
            if (label && display !== undefined) stats[label] = display;
          });
          return {
            gameId,
            playedAt: asString(eventMeta?.gameDate) ?? asString(entry.gameDate),
            opponent: asString(opponent?.displayName) ?? asString(opponent?.abbreviation),
            result: asString(entry.gameResult) ?? asString(asRecord(eventMeta?.gameResult)?.displayResult),
            stats,
          };
        });
      })
      .filter((e): e is EspnGameLogEntry => Boolean(e));
  } catch {
    return [];
  }
}

/** Play-by-play for one event (from the summary payload). Soft-fail via fetchEventSummary. */
export async function fetchPlayByPlay(sport: EspnSportSlug, eventId: string): Promise<EspnPlayByPlayData | undefined> {
  const summary = await fetchEventSummary(sport, eventId);
  return summary?.playByPlay;
}

/** Win-probability series for one event (from the summary payload). Soft-fail via fetchEventSummary. */
export async function fetchWinProbability(sport: EspnSportSlug, eventId: string): Promise<EspnWinProbabilityPoint[] | undefined> {
  const summary = await fetchEventSummary(sport, eventId);
  return summary?.winProbability;
}

/** ESPN predictor projection for one event (from the summary payload). Soft-fail via fetchEventSummary. */
export async function fetchPredictor(sport: EspnSportSlug, eventId: string): Promise<EspnPredictorData | undefined> {
  const summary = await fetchEventSummary(sport, eventId);
  return summary?.predictor;
}

/**
 * Full event summary: scoreboard state plus whichever intelligence sections
 * ESPN returned (play-by-play, win probability, predictor, BPI/power index,
 * odds, injuries). Soft-fail per section and overall: a total failure
 * resolves to a minimal scoreboard-less record only when the header itself
 * is unusable, in which case `undefined` is returned.
 */
export async function fetchEventSummary(sport: EspnSportSlug, eventId: string): Promise<EspnSummaryData | undefined> {
  try {
    const payload = await espnRequest(sport, "summary", {
      params: { event: eventId },
      cacheTtlMs: SCOREBOARD_CACHE_TTL_MS,
    });

    // The summary payload carries the event's scoreboard state under
    // header.competitions[0]; if even that is unusable there is nothing to
    // anchor the record to, so treat it as a total soft-fail.
    const header = asRecord(payload.header);
    const headerCompetition = header ? competitionOf(header) : undefined;
    const headerEvent = header && headerCompetition ? { ...header, competitions: [headerCompetition] } : {};
    const scoreboard = mapEvent(headerEvent);
    if (!scoreboard) return undefined;

    const odds = asArray(payload.odds)
      .map(toEventOdds)
      .filter((o): o is EspnEventOdds => Boolean(o));
    const playByPlay = mapPlayByPlay(payload.plays);
    const winProbability = mapWinProbability(payload.winprobability);
    const predictor = mapPredictor(payload.predictor);
    const powerIndex = mapPowerIndex(payload.powerindex);
    const injuries = mapSummaryInjuries(payload.injuries);

    // Optional sections are conditionally spread so exactOptionalPropertyTypes
    // never sees an explicit `undefined` value.
    return {
      scoreboard,
      ...(playByPlay ? { playByPlay } : {}),
      ...(winProbability ? { winProbability } : {}),
      ...(predictor ? { predictor } : {}),
      ...(powerIndex ? { powerIndex } : {}),
      ...(odds.length > 0 ? { odds } : {}),
      ...(injuries ? { injuries } : {}),
    };
  } catch {
    return undefined;
  }
}

/** League news headlines (different host than the sport endpoints). Soft-fail: returns [] on error. */
export async function fetchLeagueNews(sport: EspnSportSlug, limit = 20): Promise<EspnNewsArticle[]> {
  try {
    const payload = await fetchEspnRaw({
      url: `${ESPN_WEB_BASE}/${ESPN_SPORT_PATHS[sport]}/news`,
      params: { limit: String(Math.min(Math.max(Math.trunc(limit), 1), 50)) },
      cacheTtlMs: NEWS_CACHE_TTL_MS,
    });
    return asArray(payload.articles ?? asRecord(payload.header)?.articles)
      .map(mapNewsArticle)
      .filter((a): a is EspnNewsArticle => Boolean(a));
  } catch {
    return [];
  }
}

// ---------- record builders (fetch + lineage envelope in one step) ----------

export async function fetchScoreboardRecord(sport: EspnSportSlug, dates?: string): Promise<EspnRecordRow> {
  const retrievedAt = new Date().toISOString();
  const events = await fetchScoreboard(sport, dates);
  return buildRecord(sport, "scoreboard", dates ?? "today", events, retrievedAt);
}

export async function fetchTeamsRecord(sport: EspnSportSlug): Promise<EspnRecordRow> {
  const retrievedAt = new Date().toISOString();
  const teams = await fetchTeams(sport);
  return buildRecord(sport, "teams", "all", teams, retrievedAt);
}

export async function fetchRosterRecord(sport: EspnSportSlug, teamId: string): Promise<EspnRecordRow> {
  const retrievedAt = new Date().toISOString();
  const roster = await fetchRoster(sport, teamId);
  return buildRecord(sport, "roster", teamId, roster, retrievedAt);
}

export async function fetchInjuriesRecord(sport: EspnSportSlug): Promise<EspnRecordRow> {
  const retrievedAt = new Date().toISOString();
  const injuries = await fetchInjuries(sport);
  return buildRecord(sport, "injuries", "all", injuries, retrievedAt);
}

export async function fetchStandingsRecord(sport: EspnSportSlug): Promise<EspnRecordRow> {
  const retrievedAt = new Date().toISOString();
  const standings = await fetchStandings(sport);
  return buildRecord(sport, "standings", "all", standings, retrievedAt);
}

export async function fetchSummaryRecord(sport: EspnSportSlug, eventId: string): Promise<EspnRecordRow | undefined> {
  const retrievedAt = new Date().toISOString();
  const summary = await fetchEventSummary(sport, eventId);
  if (!summary) return undefined;
  return buildRecord(sport, "summary", eventId, summary, retrievedAt, eventId);
}

export async function fetchAthleteRecord(sport: EspnSportSlug, athleteId: string): Promise<EspnRecordRow | undefined> {
  const retrievedAt = new Date().toISOString();
  const athlete = await fetchAthlete(sport, athleteId);
  if (!athlete) return undefined;
  return buildRecord(sport, "athlete", athleteId, athlete, retrievedAt);
}
