// Shared domain types for Runner Sports & Analytics
//
// SOURCE SEPARATION MODEL
// Every data point that eventually comes from a live pipeline should be able
// to declare what kind of claim it is (fact vs. calculation vs. model output
// vs. inference) and where/when it was retrieved. SourceMetadata below is the
// seed of that contract; Phase 1 stamps everything "simulated".

export type Confidence = "low" | "moderate" | "high";
export type RiskLevel = "low" | "moderate" | "high";
export type GameStatus = "scheduled" | "live" | "final";
export type BetResult = "win" | "loss" | "push" | "pending";
export type ModelStatus = "active" | "beta" | "training" | "deprecated";
export type DataType = "fact" | "calculation" | "model_output" | "inference" | "unknown";
export type Freshness = "live" | "delayed" | "simulated";
export type TrendDirection = "up" | "down" | "flat";

export interface Sport {
  id: string;
  name: string;
  slug: string;
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  record?: string;
  logoUrl?: string;
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position?: string;
  headshotUrl?: string;
}

export interface SourceMetadata {
  source: string;
  retrievedAt: string;
  sport: string;
  league?: string;
  eventId?: string;
  dataType: DataType;
  freshness: Freshness;
}

export interface Market {
  id: string;
  label: string;
  type: "moneyline" | "spread" | "total" | "prop";
}

export type MarketConfirmationStatus = "confirmed" | "strong_consensus" | "thin" | "rejected";

export interface ConfirmedMarket {
  marketKey: string;
  participant?: string;
  point: number;
  bookCount: number;
  status: MarketConfirmationStatus;
  bestOver?: { sportsbook: string; price: number };
  bestUnder?: { sportsbook: string; price: number };
  medianOverPrice?: number;
  medianUnderPrice?: number;
  overround?: number;
  noVigOverProbability?: number;
  noVigUnderProbability?: number;
  updatedAt: string;
}

// MULTI-PROVIDER IDENTITY + LINEAGE
// The Odds API remains the market-pricing source of truth; ESPN is the
// sports-facts/enrichment provider (teams, rosters, injuries, standings,
// play-by-play, win probability, predictor, power index, news, odds
// cross-checks). Because ESPN's endpoints are unofficial and unstable, every
// ESPN payload is persisted as a normalized record in `espn_records` carrying
// full SourceMetadata lineage, and every ESPN call is designed to fail soft —
// a provider outage must degrade enrichment, never block the market pipeline.
//
// Canonical identity lives in the `team_registry` table: one row per team per
// league, keyed by our own rsa:<league>:<slug> id, storing each provider's id
// plus name aliases so records from any provider join safely. Ingestion
// upserts the registry from ESPN (authoritative team facts), and the Odds API
// provider resolves its name-only teams against it (see
// lib/data/teamRegistry.ts and lib/providers/oddsApi.ts).

export type EspnSportSlug = "nfl" | "nba" | "mlb" | "nhl" | "ncaaf" | "ncaab" | "wnba";

export interface TeamRegistryEntry {
  id: string;
  league: string;
  name: string;
  abbreviation: string;
  espnId?: string;
  oddsApiName?: string;
  aliases: string[];
  logoUrl?: string;
}

export interface EspnCompetitorScore {
  teamId: string;
  teamName: string;
  teamAbbreviation?: string;
  homeAway: "home" | "away";
  score?: number;
  winner?: boolean;
  record?: string;
}

export interface EspnScoreboardEvent {
  eventId: string;
  name: string;
  shortName?: string;
  startsAt: string;
  status: GameStatus;
  statusDetail?: string;
  venue?: string;
  competitors: EspnCompetitorScore[];
  broadcasts: string[];
  espnOdds?: EspnEventOdds;
}

export interface EspnLeagueTeam {
  espnId: string;
  name: string;
  abbreviation?: string;
  displayName?: string;
  location?: string;
  logoUrl?: string;
}

export interface EspnRosterAthlete {
  espnId: string;
  name: string;
  jersey?: string;
  position?: string;
  height?: string;
  weight?: number;
  age?: number;
  headshotUrl?: string;
}

export interface EspnInjuryEntry {
  teamId: string;
  teamName: string;
  athleteId?: string;
  athleteName: string;
  position?: string;
  status?: string;
  detail?: string;
}

export interface EspnStandingEntry {
  teamId: string;
  teamName: string;
  abbreviation?: string;
  group?: string;
  wins?: number;
  losses?: number;
  ties?: number;
  winPercent?: number;
  gamesBehind?: string;
  streak?: string;
  playoffSeed?: number;
}

export interface EspnAthleteProfile {
  espnId: string;
  name: string;
  teamId?: string;
  teamName?: string;
  position?: string;
  jersey?: string;
  height?: string;
  weight?: number;
  age?: number;
  headshotUrl?: string;
}

export interface EspnAthleteStatCategory {
  name: string;
  stats: { name: string; value: string }[];
}

export interface EspnGameLogEntry {
  gameId?: string;
  playedAt?: string;
  opponent?: string;
  result?: string;
  stats: Record<string, string>;
}

// The summary endpoint packs several intelligence surfaces for one event;
// each is optional because ESPN only includes the ones it actually has for
// that sport/event, and any of them may disappear without notice.
export interface EspnPlayByPlayData {
  periods: number;
  plays: {
    id: string;
    period?: number;
    clock?: string;
    text: string;
    teamId?: string;
    scoringPlay: boolean;
  }[];
}

export interface EspnWinProbabilityPoint {
  playId?: string;
  period?: number;
  clock?: string;
  homeWinPercentage: number;
  tiePercentage?: number;
}

export interface EspnPredictorData {
  homeWinPercentage?: number;
  awayWinPercentage?: number;
}

export interface EspnPowerIndexEntry {
  teamId: string;
  teamName: string;
  metricName: string;
  values: Record<string, string>;
}

export interface EspnEventOdds {
  provider?: string;
  details?: string;
  overUnder?: number;
  homeMoneyline?: number;
  awayMoneyline?: number;
}

export interface EspnSummaryData {
  scoreboard: EspnScoreboardEvent;
  playByPlay?: EspnPlayByPlayData;
  winProbability?: EspnWinProbabilityPoint[];
  predictor?: EspnPredictorData;
  powerIndex?: EspnPowerIndexEntry[];
  odds?: EspnEventOdds[];
  injuries?: EspnInjuryEntry[];
}

export interface EspnNewsArticle {
  id: string;
  headline: string;
  description?: string;
  publishedAt?: string;
  link?: string;
}

export type EspnRecordDataType =
  | "scoreboard"
  | "teams"
  | "roster"
  | "injuries"
  | "standings"
  | "athlete"
  | "athlete-stats"
  | "athlete-gamelog"
  | "summary";

export interface EspnRecordRow {
  id: string;
  provider: string;
  sport: string;
  league: string;
  dataType: EspnRecordDataType;
  entityId: string;
  payload: unknown;
  retrievedAt: string;
  source: SourceMetadata;
}

export interface OddsSnapshot {
  sportsbook: string;
  line?: number;
  odds: number;
  capturedAt: string;
}

export interface LineMovement {
  direction: TrendDirection;
  openLine: number;
  currentLine: number;
  consensus: string;
}

export interface Game {
  id: string;
  sport: Sport;
  league: string;
  homeTeam: Team;
  awayTeam: Team;
  startsAt: string;
  status: GameStatus;
  moneyline: { home: number; away: number };
  spread: { home: number; away: number; line: number };
  total: { line: number; over: number; under: number };
  runnerProjectedWinner: string;
  modelProbability: number;
  marketImpliedProbability: number;
  confidence: Confidence;
  keyFactors: string[];
  confirmedMarkets?: ConfirmedMarket[];
  source: SourceMetadata;
}

export interface PlayerProp {
  id: string;
  gameId: string;
  player: Player;
  opponent: string;
  sport: string;
  market: string;
  line: number;
  overOdds: number;
  underOdds: number;
  // Runner does not yet run an independent player-performance projection
  // model — these stay undefined rather than fabricated until one exists.
  projection?: number;
  probability: number;
  edge: number;
  confidence: Confidence;
  // No historical hit-rate or scouting/matchup data source is connected yet.
  recentHitRate?: number;
  matchupContext?: string;
  source: SourceMetadata;
}

export interface RunnerEdge {
  id: string;
  rank: number;
  sport: string;
  league: string;
  event: string;
  market: string;
  selection: string;
  sportsbook?: string;
  line?: number;
  odds?: number;
  impliedProbability: number;
  modelProbability: number;
  edge: number;
  confidence: Confidence;
  riskLevel: RiskLevel;
  source: string;
  updatedAt: string;
}

export interface TrackedBet {
  id: string;
  date: string;
  sport: string;
  event: string;
  selection: string;
  market: string;
  sportsbook: string;
  odds: number;
  stake: number;
  result: BetResult;
  profit: number;
  closingOdds?: number;
  clv?: number;
}

export interface RunnerModel {
  id: string;
  name: string;
  version: string;
  sport: string;
  target: string;
  status: ModelStatus;
  sampleSize: number;
  accuracy: number;
  calibration: number;
  roi?: number;
  lastUpdated: string;
  description: string;
}

export interface ModelOutput {
  modelId: string;
  eventId: string;
  probability: number;
  confidence: Confidence;
  generatedAt: string;
}

export interface MarketSignal {
  id: string;
  event: string;
  market: string;
  movement: LineMovement;
  modelMarketDelta: number;
  note: string;
}

export interface MarketMovementSnapshot {
  id: string;
  event: string;
  market: string;
  sportsbook: string;
  openingLine: number;
  currentLine: number;
  openingPrice: number;
  currentPrice: number;
  direction: TrendDirection;
  capturedAt: string;
  source: SourceMetadata;
}

export interface TrackerSummary {
  totalWagers: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  unitsWonLost: number;
  totalProfit: number;
  roi: number;
  winRate: number;
  averageOdds: number;
  averageClv: number;
}
