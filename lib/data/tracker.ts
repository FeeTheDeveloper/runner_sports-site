import type { BetResult, TrackedBet, TrackerSummary } from "@/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

interface TrackedBetRow {
  id: string;
  bet_date: string;
  sport: string;
  event: string;
  selection: string;
  market: string;
  sportsbook: string;
  odds: number;
  stake: number;
  result: BetResult;
  profit: number;
  closing_odds: number | null;
  clv: number | null;
}

function mapRow(row: TrackedBetRow): TrackedBet {
  return {
    id: row.id,
    date: row.bet_date,
    sport: row.sport,
    event: row.event,
    selection: row.selection,
    market: row.market,
    sportsbook: row.sportsbook,
    odds: row.odds,
    stake: row.stake,
    result: row.result,
    profit: row.profit,
    closingOdds: row.closing_odds ?? undefined,
    clv: row.clv ?? undefined,
  };
}

export async function getTrackedBets(): Promise<TrackedBet[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tracked_bets")
    .select("*")
    .order("bet_date", { ascending: false });
  if (error) throw error;
  return (data as unknown as TrackedBetRow[]).map(mapRow);
}

export async function getTrackerSummary(): Promise<TrackerSummary> {
  const bets = await getTrackedBets();
  const settled = bets.filter((b) => b.result !== "pending");
  const wins = settled.filter((b) => b.result === "win").length;
  const losses = settled.filter((b) => b.result === "loss").length;
  const pushes = settled.filter((b) => b.result === "push").length;
  const pending = bets.length - settled.length;

  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const totalProfit = settled.reduce((sum, b) => sum + b.profit, 0);
  const averageOdds = settled.length > 0 ? Math.round(settled.reduce((sum, b) => sum + b.odds, 0) / settled.length) : 0;
  const clvBets = settled.filter((b) => typeof b.clv === "number");
  const averageClv = clvBets.length > 0 ? clvBets.reduce((sum, b) => sum + (b.clv ?? 0), 0) / clvBets.length : 0;

  return {
    totalWagers: bets.length,
    wins,
    losses,
    pushes,
    pending,
    unitsWonLost: Math.round((totalProfit / 100) * 100) / 100,
    totalProfit: Math.round(totalProfit * 100) / 100,
    roi: totalStaked > 0 ? totalProfit / totalStaked : 0,
    winRate: wins + losses > 0 ? wins / (wins + losses) : 0,
    averageOdds,
    averageClv: Math.round(averageClv * 10) / 10,
  };
}

export interface NewTrackedBet {
  date: string;
  sport: string;
  event: string;
  selection: string;
  market: string;
  sportsbook: string;
  odds: number;
  stake: number;
  result?: BetResult;
  closingOdds?: number;
  clv?: number;
}

function computeProfit(result: BetResult, odds: number, stake: number): number {
  if (result === "win") {
    return odds > 0 ? Math.round(stake * (odds / 100) * 100) / 100 : Math.round(stake * (100 / Math.abs(odds)) * 100) / 100;
  }
  if (result === "loss") {
    return -stake;
  }
  return 0;
}

export async function addTrackedBet(input: NewTrackedBet): Promise<TrackedBet> {
  const result = input.result ?? "pending";
  const profit = computeProfit(result, input.odds, input.stake);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("tracked_bets")
    .insert({
      bet_date: input.date,
      sport: input.sport,
      event: input.event,
      selection: input.selection,
      market: input.market,
      sportsbook: input.sportsbook,
      odds: input.odds,
      stake: input.stake,
      result,
      profit,
      closing_odds: input.closingOdds ?? null,
      clv: input.clv ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return mapRow(data as unknown as TrackedBetRow);
}
