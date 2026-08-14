import type { MarketSignal } from "@/types";

const mockSignals: MarketSignal[] = [
  {
    id: "signal-001",
    event: "MIA Dolphins @ BUF Bills",
    market: "Spread",
    movement: { direction: "up", openLine: -2.5, currentLine: -3.5, consensus: "72% on BUF" },
    modelMarketDelta: 0.012,
    note: "Line moved toward Runner projection after injury report.",
  },
  {
    id: "signal-002",
    event: "OKC Thunder @ DEN Nuggets",
    market: "Total",
    movement: { direction: "down", openLine: 231.5, currentLine: 228.0, consensus: "64% on Under" },
    modelMarketDelta: -0.008,
    note: "Market pacing below Runner projected possessions.",
  },
  {
    id: "signal-003",
    event: "SFG Giants @ LAD Dodgers",
    market: "Run Line",
    movement: { direction: "flat", openLine: 138, currentLine: 138, consensus: "55% on LAD -1.5" },
    modelMarketDelta: 0.006,
    note: "No meaningful steam; model sees modest value regardless.",
  },
  {
    id: "signal-004",
    event: "DAL Cowboys @ SF 49ers",
    market: "Total",
    movement: { direction: "down", openLine: 46.5, currentLine: 44.5, consensus: "68% on Under" },
    modelMarketDelta: 0.003,
    note: "Sharp-side move in line with weather update; edge now thin.",
  },
];

export async function getMarketSignals(): Promise<MarketSignal[]> {
  return mockSignals;
}
