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
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position?: string;
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
  confidence: Confidence;
  keyFactors: string[];
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
