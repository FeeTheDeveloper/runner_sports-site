import type { Confidence, Game } from "@/types";
import { sports } from "@/lib/data/sports";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  americanToImpliedProbability,
  classifyConfidence,
  computeConsensusProbability,
  devigTwoWay,
} from "@/lib/models/edgeCalculator";
import type { BookOddsSnapshot } from "@/lib/providers/oddsApi";

interface GameRow {
  id: string;
  sport_id: string;
  league: string;
  home_team: { id: string; name: string; abbreviation: string; record?: string };
  away_team: { id: string; name: string; abbreviation: string; record?: string };
  starts_at: string;
  status: Game["status"];
  book_odds: BookOddsSnapshot[];
  key_factors: string[];
  source: Game["source"];
}

// American odds are never literally 0, so 0 is used as a "no book data yet"
// sentinel rather than a fabricated price — see mapRowToGame below.
const NO_ODDS = 0;

function mapRowToGame(row: GameRow): Game {
  const sport = sports.find((s) => s.id === row.sport_id) ?? {
    id: row.sport_id,
    name: row.league,
    slug: row.sport_id,
  };

  const moneylineBooks = row.book_odds.filter((b) => b.moneyline);
  const spreadBooks = row.book_odds.filter((b) => b.spread);
  const totalBooks = row.book_odds.filter((b) => b.total);

  const consensusHomeFair =
    moneylineBooks.length > 0
      ? computeConsensusProbability(
          moneylineBooks.map((b) => devigTwoWay(b.moneyline!.home, b.moneyline!.away).probabilityA),
        )
      : 0.5;

  const confidence: Confidence = classifyConfidence(moneylineBooks.length);
  const displayedMoneyline = moneylineBooks[0]?.moneyline ?? { home: NO_ODDS, away: NO_ODDS };
  const displayedSpread = spreadBooks[0]?.spread ?? { home: NO_ODDS, away: NO_ODDS, line: 0 };
  const displayedTotal = totalBooks[0]?.total ?? { line: 0, over: NO_ODDS, under: NO_ODDS };

  // Always resolve to the projected winner (favorite), not the home team's
  // raw number — a road favorite must show its own (higher) probability,
  // not the home underdog's lower one.
  const isHomeFavorite = consensusHomeFair >= 0.5;
  const favoriteFairProbability = isHomeFavorite ? consensusHomeFair : 1 - consensusHomeFair;
  const favoriteMoneyline = isHomeFavorite ? displayedMoneyline.home : displayedMoneyline.away;
  const hasMoneylineOdds = displayedMoneyline.home !== NO_ODDS && displayedMoneyline.away !== NO_ODDS;

  return {
    id: row.id,
    sport,
    league: row.league,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    startsAt: row.starts_at,
    status: row.status,
    moneyline: displayedMoneyline,
    spread: displayedSpread,
    total: displayedTotal,
    runnerProjectedWinner: isHomeFavorite ? row.home_team.id : row.away_team.id,
    modelProbability: Math.round(favoriteFairProbability * 1000) / 1000,
    marketImpliedProbability: hasMoneylineOdds
      ? Math.round(americanToImpliedProbability(favoriteMoneyline) * 1000) / 1000
      : Math.round(favoriteFairProbability * 1000) / 1000,
    confidence,
    // No scouting/analysis pipeline is connected yet, so this stays empty
    // rather than carrying over the old mock's fabricated bullet points.
    keyFactors: row.key_factors,
    source: row.source,
  };
}

export async function getGames(): Promise<Game[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("games").select("*").order("starts_at", { ascending: true });
  if (error) throw error;
  return (data as unknown as GameRow[]).map(mapRowToGame);
}

export async function getGameById(id: string): Promise<Game | undefined> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapRowToGame(data as unknown as GameRow) : undefined;
}
