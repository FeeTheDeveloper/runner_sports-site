import type { MarketMovementSnapshot } from "@/types";

const baseSource = {
  source: "Runner Demo Market Feed",
  retrievedAt: "2026-08-13T18:42:00-05:00",
  sport: "Multi-sport",
  dataType: "fact" as const,
  freshness: "simulated" as const,
};

const mockMarketMovements: MarketMovementSnapshot[] = [
  { id: "mm-1", event: "MIA Dolphins @ BUF Bills", market: "BUF spread", sportsbook: "Demo Book A", openingLine: -2.5, currentLine: -3.5, openingPrice: -110, currentPrice: -105, direction: "up", capturedAt: "2026-08-13T18:42:00-05:00", source: baseSource },
  { id: "mm-2", event: "OKC Thunder @ DEN Nuggets", market: "Game total", sportsbook: "Demo Book B", openingLine: 231.5, currentLine: 228, openingPrice: -108, currentPrice: -112, direction: "down", capturedAt: "2026-08-13T18:39:00-05:00", source: baseSource },
  { id: "mm-3", event: "SFG Giants @ LAD Dodgers", market: "LAD run line", sportsbook: "Demo Book C", openingLine: -1.5, currentLine: -1.5, openingPrice: 138, currentPrice: 132, direction: "flat", capturedAt: "2026-08-13T18:35:00-05:00", source: baseSource },
  { id: "mm-4", event: "DAL Cowboys @ SF 49ers", market: "Game total", sportsbook: "Demo Book A", openingLine: 46.5, currentLine: 44.5, openingPrice: -110, currentPrice: -108, direction: "down", capturedAt: "2026-08-13T18:31:00-05:00", source: baseSource },
];

export async function getMarketMovements(): Promise<MarketMovementSnapshot[]> {
  return mockMarketMovements;
}
