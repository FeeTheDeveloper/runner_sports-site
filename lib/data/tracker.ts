import type { TrackedBet, TrackerSummary } from "@/types";

const mockBets: TrackedBet[] = [
  {
    id: "bet-001",
    date: "2026-08-10",
    sport: "NFL",
    event: "KC Chiefs @ LAC Chargers",
    selection: "KC Chiefs -2.5",
    market: "Spread",
    sportsbook: "Runner Composite",
    odds: -110,
    stake: 100,
    result: "win",
    profit: 90.91,
    closingOdds: -125,
    clv: 4.8,
  },
  {
    id: "bet-002",
    date: "2026-08-10",
    sport: "MLB",
    event: "NYY Yankees @ BOS Red Sox",
    selection: "Over 8.5",
    market: "Total",
    sportsbook: "Runner Composite",
    odds: -105,
    stake: 50,
    result: "loss",
    profit: -50,
    closingOdds: -112,
    clv: 2.1,
  },
  {
    id: "bet-003",
    date: "2026-08-11",
    sport: "NBA",
    event: "MIL Bucks @ PHI 76ers",
    selection: "PHI 76ers ML",
    market: "Moneyline",
    sportsbook: "Runner Composite",
    odds: 142,
    stake: 40,
    result: "win",
    profit: 56.8,
    closingOdds: 128,
    clv: -3.4,
  },
  {
    id: "bet-004",
    date: "2026-08-11",
    sport: "NHL",
    event: "TOR Maple Leafs @ MTL Canadiens",
    selection: "TOR Maple Leafs -1.5",
    market: "Puck Line",
    sportsbook: "Runner Composite",
    odds: 165,
    stake: 30,
    result: "push",
    profit: 0,
    closingOdds: 160,
    clv: -1.1,
  },
  {
    id: "bet-005",
    date: "2026-08-12",
    sport: "NFL",
    event: "DET Lions @ GB Packers",
    selection: "Jared Goff Over 245.5 Pass Yds",
    market: "Player Prop",
    sportsbook: "Runner Composite",
    odds: -108,
    stake: 60,
    result: "win",
    profit: 55.56,
    closingOdds: -118,
    clv: 4.2,
  },
  {
    id: "bet-006",
    date: "2026-08-12",
    sport: "MLB",
    event: "HOU Astros @ TEX Rangers",
    selection: "Under 8.0",
    market: "Total",
    sportsbook: "Runner Composite",
    odds: -110,
    stake: 45,
    result: "loss",
    profit: -45,
    closingOdds: -108,
    clv: -0.9,
  },
  {
    id: "bet-007",
    date: "2026-08-13",
    sport: "NBA",
    event: "DEN Nuggets vs. OKC Thunder",
    selection: "OKC Thunder ML",
    market: "Moneyline",
    sportsbook: "Runner Composite",
    odds: -152,
    stake: 76,
    result: "pending",
    profit: 0,
  },
  {
    id: "bet-008",
    date: "2026-08-13",
    sport: "NFL",
    event: "MIA Dolphins @ BUF Bills",
    selection: "BUF Bills ML",
    market: "Moneyline",
    sportsbook: "Runner Composite",
    odds: -168,
    stake: 84,
    result: "pending",
    profit: 0,
  },
];

export async function getTrackedBets(): Promise<TrackedBet[]> {
  return [...mockBets].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getTrackerSummary(): Promise<TrackerSummary> {
  const settled = mockBets.filter((b) => b.result !== "pending");
  const wins = settled.filter((b) => b.result === "win").length;
  const losses = settled.filter((b) => b.result === "loss").length;
  const pushes = settled.filter((b) => b.result === "push").length;
  const pending = mockBets.length - settled.length;

  const totalStaked = settled.reduce((sum, b) => sum + b.stake, 0);
  const totalProfit = settled.reduce((sum, b) => sum + b.profit, 0);
  const averageOdds = Math.round(settled.reduce((sum, b) => sum + b.odds, 0) / settled.length);
  const clvBets = settled.filter((b) => typeof b.clv === "number");
  const averageClv = clvBets.reduce((sum, b) => sum + (b.clv ?? 0), 0) / clvBets.length;

  return {
    totalWagers: mockBets.length,
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
