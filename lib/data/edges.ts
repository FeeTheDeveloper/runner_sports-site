import type { Confidence, RiskLevel, RunnerEdge } from "@/types";
import { sports } from "@/lib/data/sports";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  americanToImpliedProbability,
  classifyConfidence,
  computeConsensusProbability,
  computeEdge,
  devigTwoWay,
} from "@/lib/models/edgeCalculator";
import type { BookOddsSnapshot } from "@/lib/providers/oddsApi";

const RISK_BY_CONFIDENCE: Record<Confidence, RiskLevel> = {
  high: "low",
  moderate: "moderate",
  low: "high",
};

interface GameRow {
  id: string;
  sport_id: string;
  league: string;
  home_team: { id: string; name: string };
  away_team: { id: string; name: string };
  book_odds: BookOddsSnapshot[];
  updated_at: string;
}

interface PropRow {
  id: string;
  game_id: string;
  player: { name: string; team: string };
  opponent: string;
  sport: string;
  market: string;
  book_odds: { sportsbook: string; line: number; overOdds: number; underOdds: number }[];
  updated_at: string;
}

function gameMoneylineEdges(row: GameRow): RunnerEdge[] {
  const moneylineBooks = row.book_odds.filter((b) => b.moneyline);
  if (moneylineBooks.length === 0) return [];

  const consensusHomeFair = computeConsensusProbability(
    moneylineBooks.map((b) => devigTwoWay(b.moneyline!.home, b.moneyline!.away).probabilityA),
  );
  const confidence = classifyConfidence(moneylineBooks.length);
  const displayed = moneylineBooks[0];
  const eventLabel = `${row.away_team.name} @ ${row.home_team.name}`;
  const league = sports.find((s) => s.id === row.sport_id)?.name ?? row.league;

  const homeEdge = computeEdge(consensusHomeFair, americanToImpliedProbability(displayed.moneyline!.home));
  const awayEdge = computeEdge(1 - consensusHomeFair, americanToImpliedProbability(displayed.moneyline!.away));

  const entries: RunnerEdge[] = [];
  if (homeEdge > 0) {
    entries.push({
      id: `${row.id}-ml-home`,
      rank: 0,
      sport: league,
      league,
      event: eventLabel,
      market: "Moneyline",
      selection: `${row.home_team.name} ML`,
      sportsbook: displayed.sportsbook,
      odds: displayed.moneyline!.home,
      impliedProbability: Math.round(americanToImpliedProbability(displayed.moneyline!.home) * 1000) / 1000,
      modelProbability: Math.round(consensusHomeFair * 1000) / 1000,
      edge: Math.round(homeEdge * 1000) / 1000,
      confidence,
      riskLevel: RISK_BY_CONFIDENCE[confidence],
      source: "The Odds API (no-vig consensus)",
      updatedAt: row.updated_at,
    });
  }
  if (awayEdge > 0) {
    entries.push({
      id: `${row.id}-ml-away`,
      rank: 0,
      sport: league,
      league,
      event: eventLabel,
      market: "Moneyline",
      selection: `${row.away_team.name} ML`,
      sportsbook: displayed.sportsbook,
      odds: displayed.moneyline!.away,
      impliedProbability: Math.round(americanToImpliedProbability(displayed.moneyline!.away) * 1000) / 1000,
      modelProbability: Math.round((1 - consensusHomeFair) * 1000) / 1000,
      edge: Math.round(awayEdge * 1000) / 1000,
      confidence,
      riskLevel: RISK_BY_CONFIDENCE[confidence],
      source: "The Odds API (no-vig consensus)",
      updatedAt: row.updated_at,
    });
  }
  return entries;
}

function propEdge(row: PropRow): RunnerEdge | null {
  if (row.book_odds.length === 0) return null;

  const consensusOverFair = computeConsensusProbability(
    row.book_odds.map((b) => devigTwoWay(b.overOdds, b.underOdds).probabilityA),
  );
  const confidence = classifyConfidence(row.book_odds.length);
  const displayed = row.book_odds[0];
  const impliedOver = americanToImpliedProbability(displayed.overOdds);
  const edge = computeEdge(consensusOverFair, impliedOver);
  if (edge <= 0) return null;

  return {
    id: `${row.id}-over`,
    rank: 0,
    sport: row.sport,
    league: row.sport,
    event: `${row.player.team} vs ${row.opponent}`,
    market: row.market,
    selection: `${row.player.name} Over ${displayed.line} ${row.market}`,
    sportsbook: displayed.sportsbook,
    odds: displayed.overOdds,
    impliedProbability: Math.round(impliedOver * 1000) / 1000,
    modelProbability: Math.round(consensusOverFair * 1000) / 1000,
    edge: Math.round(edge * 1000) / 1000,
    confidence,
    riskLevel: RISK_BY_CONFIDENCE[confidence],
    source: "The Odds API (no-vig consensus)",
    updatedAt: row.updated_at,
  };
}

export async function getEdges(): Promise<RunnerEdge[]> {
  const supabase = getSupabaseServerClient();
  const [{ data: games, error: gamesError }, { data: props, error: propsError }] = await Promise.all([
    supabase.from("games").select("id, sport_id, league, home_team, away_team, book_odds, updated_at"),
    supabase.from("props").select("id, game_id, player, opponent, sport, market, book_odds, updated_at"),
  ]);
  if (gamesError) throw gamesError;
  if (propsError) throw propsError;

  const fromGames = (games as unknown as GameRow[]).flatMap(gameMoneylineEdges);
  const fromProps = (props as unknown as PropRow[]).map(propEdge).filter((e): e is RunnerEdge => e !== null);

  return [...fromGames, ...fromProps]
    .sort((a, b) => b.edge - a.edge)
    .map((edge, index) => ({ ...edge, rank: index + 1 }));
}
