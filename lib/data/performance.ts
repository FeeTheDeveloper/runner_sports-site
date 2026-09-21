import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { PerformanceBucket, RunnerBetRecord, RunnerPerformanceSummary } from "@/types";

interface RunnerBetPerformanceRow {
  id: string;
  juice_bet_id: number;
  sportsbook: string;
  bet_result: string | null;
  risk_amount: number | null;
  amount_won_or_lost: number | null;
  max_potential_win: number | null;
  odds_american: number | null;
  number_of_legs: number;
  date_placed: string | null;
  date_settled: string | null;
  roi_percent: number | null;
}

interface RunnerBetLegRow {
  juice_bet_id: number;
  sport: string | null;
  league: string | null;
  leg_type: string | null;
  duration: string | null;
}

interface RunnerPortfolioSummaryRow {
  total_bets: number;
  wins: number;
  losses: number;
  cashouts: number;
  total_risked: number;
  net_profit: number;
  roi_percent: number;
  average_risk: number | null;
  average_leg_count: number | null;
}

function mapBetRow(row: RunnerBetPerformanceRow): RunnerBetRecord {
  return {
    id: row.id,
    juiceBetId: row.juice_bet_id,
    sportsbook: row.sportsbook,
    betResult: row.bet_result,
    riskAmount: row.risk_amount,
    amountWonOrLost: row.amount_won_or_lost,
    maxPotentialWin: row.max_potential_win,
    oddsAmerican: row.odds_american,
    numberOfLegs: row.number_of_legs,
    datePlaced: row.date_placed,
    dateSettled: row.date_settled,
    roiPercent: row.roi_percent,
  };
}

export interface RunnerMarketTypeRow {
  league: string | null;
  sport: string | null;
  legType: string | null;
  betsExposed: number;
  legs: number;
  approximateRisk: number | null;
  approximateProfit: number | null;
}

interface RunnerMarketTypePerformanceRow {
  league: string | null;
  sport: string | null;
  leg_type: string | null;
  bets_exposed: number;
  legs: number;
  approximate_risk: number | null;
  approximate_profit: number | null;
}

// Exploratory: see the attribution caveat on runner_market_type_performance
// in the migration — a parlay's full ticket P/L is attributed to every
// market it touches, so this overstates single-market performance.
export async function getMarketTypePerformance(): Promise<RunnerMarketTypeRow[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("runner_market_type_performance")
    .select("*")
    .order("bets_exposed", { ascending: false });
  if (error) throw error;
  return (data as unknown as RunnerMarketTypePerformanceRow[]).map((row) => ({
    league: row.league,
    sport: row.sport,
    legType: row.leg_type,
    betsExposed: row.bets_exposed,
    legs: row.legs,
    approximateRisk: row.approximate_risk,
    approximateProfit: row.approximate_profit,
  }));
}

export async function getRunnerBets(): Promise<RunnerBetRecord[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("runner_bet_performance")
    .select("*")
    .order("date_placed", { ascending: false });
  if (error) throw error;
  return (data as unknown as RunnerBetPerformanceRow[]).map(mapBetRow);
}

function legCountLabel(legs: number): string {
  if (legs <= 1) return "1 Leg";
  if (legs >= 5) return "5+ Legs";
  return `${legs} Legs`;
}

function emptyBucket(label: string): PerformanceBucket {
  return { label, bets: 0, wins: 0, losses: 0, cashouts: 0, risked: 0, profit: 0, roiPercent: 0 };
}

function accumulate(bucket: PerformanceBucket, bet: RunnerBetPerformanceRow) {
  bucket.bets += 1;
  if (bet.bet_result === "Won") bucket.wins += 1;
  else if (bet.bet_result === "Lost") bucket.losses += 1;
  else if (bet.bet_result === "CashedOut") bucket.cashouts += 1;
  bucket.risked += bet.risk_amount ?? 0;
  bucket.profit += bet.amount_won_or_lost ?? 0;
}

function finalizeBuckets(buckets: Map<string, PerformanceBucket>): PerformanceBucket[] {
  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      risked: Math.round(bucket.risked * 100) / 100,
      profit: Math.round(bucket.profit * 100) / 100,
      roiPercent: bucket.risked > 0 ? Math.round((bucket.profit / bucket.risked) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.bets - a.bets);
}

// bySportsbook and byLegCount are ticket-level dimensions, so each ticket's
// risk/P/L is counted exactly once. bySport/byLeague/byMarketType/byDuration
// come from leg attributes: a multi-leg parlay touching several sports (or
// markets, or durations) has its full ticket P/L attributed to every
// distinct value it touches, which overstates single-dimension performance
// on mixed tickets — the same approximation as runner_market_type_performance.
// Treat these as exploratory, not true per-market/per-sport ROI, until a
// leg-contribution methodology exists.
export async function getPerformanceSummary(): Promise<RunnerPerformanceSummary> {
  const supabase = getSupabaseServerClient();
  const [{ data: summaryRow, error: summaryError }, { data: betRows, error: betError }, { data: legRows, error: legError }] =
    await Promise.all([
      supabase.from("runner_portfolio_summary").select("*").single(),
      supabase.from("runner_bets").select("*"),
      supabase.from("runner_bet_legs").select("juice_bet_id, sport, league, leg_type, duration"),
    ]);
  if (summaryError) throw summaryError;
  if (betError) throw betError;
  if (legError) throw legError;

  const summary = summaryRow as unknown as RunnerPortfolioSummaryRow;
  const bets = betRows as unknown as RunnerBetPerformanceRow[];
  const legs = legRows as unknown as RunnerBetLegRow[];

  const legsByTicket = new Map<number, RunnerBetLegRow[]>();
  for (const leg of legs) {
    const list = legsByTicket.get(leg.juice_bet_id) ?? [];
    list.push(leg);
    legsByTicket.set(leg.juice_bet_id, list);
  }

  const bySportsbook = new Map<string, PerformanceBucket>();
  const byLegCount = new Map<string, PerformanceBucket>();
  const bySport = new Map<string, PerformanceBucket>();
  const byLeague = new Map<string, PerformanceBucket>();
  const byMarketType = new Map<string, PerformanceBucket>();
  const byDuration = new Map<string, PerformanceBucket>();

  for (const bet of bets) {
    const sportsbookLabel = bet.sportsbook || "Unknown";
    if (!bySportsbook.has(sportsbookLabel)) bySportsbook.set(sportsbookLabel, emptyBucket(sportsbookLabel));
    accumulate(bySportsbook.get(sportsbookLabel)!, bet);

    const legCount = legCountLabel(bet.number_of_legs);
    if (!byLegCount.has(legCount)) byLegCount.set(legCount, emptyBucket(legCount));
    accumulate(byLegCount.get(legCount)!, bet);

    const ticketLegs = legsByTicket.get(bet.juice_bet_id) ?? [];
    const distinct = (values: (string | null)[]) => new Set(values.filter((value): value is string => Boolean(value)));

    for (const sport of distinct(ticketLegs.map((leg) => leg.sport))) {
      if (!bySport.has(sport)) bySport.set(sport, emptyBucket(sport));
      accumulate(bySport.get(sport)!, bet);
    }
    for (const league of distinct(ticketLegs.map((leg) => leg.league))) {
      if (!byLeague.has(league)) byLeague.set(league, emptyBucket(league));
      accumulate(byLeague.get(league)!, bet);
    }
    for (const marketType of distinct(ticketLegs.map((leg) => leg.leg_type))) {
      if (!byMarketType.has(marketType)) byMarketType.set(marketType, emptyBucket(marketType));
      accumulate(byMarketType.get(marketType)!, bet);
    }
    for (const duration of distinct(ticketLegs.map((leg) => leg.duration))) {
      if (!byDuration.has(duration)) byDuration.set(duration, emptyBucket(duration));
      accumulate(byDuration.get(duration)!, bet);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalBets: summary.total_bets,
    wins: summary.wins,
    losses: summary.losses,
    cashouts: summary.cashouts,
    totalRisked: summary.total_risked,
    netProfit: summary.net_profit,
    roiPercent: summary.roi_percent,
    averageRisk: summary.average_risk ?? 0,
    averageLegCount: summary.average_leg_count ?? 0,
    bySportsbook: finalizeBuckets(bySportsbook),
    bySport: finalizeBuckets(bySport),
    byLeague: finalizeBuckets(byLeague),
    byMarketType: finalizeBuckets(byMarketType),
    byLegCount: finalizeBuckets(byLegCount),
    byDuration: finalizeBuckets(byDuration),
  };
}
