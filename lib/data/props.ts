import type { Confidence, PlayerProp } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  americanToImpliedProbability,
  classifyConfidence,
  computeConsensusProbability,
  computeEdge,
  devigTwoWay,
} from "@/lib/models/edgeCalculator";

interface PropBookOdds {
  sportsbook: string;
  line: number;
  overOdds: number;
  underOdds: number;
  capturedAt: string;
}

interface PropRow {
  id: string;
  game_id: string;
  player: PlayerProp["player"];
  opponent: string;
  sport: string;
  market: string;
  book_odds: PropBookOdds[];
  recent_hit_rate: number | null;
  matchup_context: string | null;
  source: PlayerProp["source"];
}

function mapRowToProp(row: PropRow): PlayerProp {
  const consensusOverFair =
    row.book_odds.length > 0
      ? computeConsensusProbability(
          row.book_odds.map((b) => devigTwoWay(b.overOdds, b.underOdds).probabilityA),
        )
      : 0.5;

  const confidence: Confidence = classifyConfidence(row.book_odds.length);
  const displayed = row.book_odds[0];
  const impliedOver = displayed ? americanToImpliedProbability(displayed.overOdds) : 0.5;

  return {
    id: row.id,
    gameId: row.game_id,
    player: row.player,
    opponent: row.opponent,
    sport: row.sport,
    market: row.market,
    line: displayed?.line ?? 0,
    overOdds: displayed?.overOdds ?? 0,
    underOdds: displayed?.underOdds ?? 0,
    probability: Math.round(consensusOverFair * 1000) / 1000,
    edge: Math.round(computeEdge(consensusOverFair, impliedOver) * 1000) / 1000,
    confidence,
    recentHitRate: row.recent_hit_rate ?? undefined,
    matchupContext: row.matchup_context ?? undefined,
    source: row.source,
  };
}

export async function getProps(): Promise<PlayerProp[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("props").select("*");
  if (error) throw error;
  return (data as unknown as PropRow[]).map(mapRowToProp);
}

export async function getPropsByGame(gameId: string): Promise<PlayerProp[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("props").select("*").eq("game_id", gameId);
  if (error) throw error;
  return (data as unknown as PropRow[]).map(mapRowToProp);
}
