import type { RunnerModel } from "@/types";

// Registry of Runner's own model definitions. This is intentionally static
// config, not something pulled from The Odds API — it documents what each
// version of RSA's methodology does, not a live data feed.
//
// accuracy/calibration/sampleSize are 0 until a real backtest against
// settled results exists; that is an honest "not measured yet" value, not a
// fabricated performance number carried over from the old mock data.
const models: RunnerModel[] = [
  {
    id: "rsa-edge-model-game",
    name: "RSA EDGE MODEL",
    version: "v0.1",
    sport: "Multi-Sport",
    target: "Moneyline no-vig consensus edge (NFL, NBA, MLB, NHL)",
    status: "beta",
    sampleSize: 0,
    accuracy: 0,
    calibration: 0,
    lastUpdated: "2026-08-20",
    description:
      "Baseline heuristic (lib/models/edgeCalculator.ts): computes a no-vig consensus win probability across every " +
      "sportsbook quoting a game's moneyline, then compares it to each individual book's own price. This is a " +
      "market-pricing signal, not a trained predictive model, and has not been backtested against settled outcomes.",
  },
  {
    id: "rsa-edge-model-prop",
    name: "RSA EDGE MODEL",
    version: "v0.1",
    sport: "Multi-Sport",
    target: "Player prop no-vig consensus edge",
    status: "training",
    sampleSize: 0,
    accuracy: 0,
    calibration: 0,
    lastUpdated: "2026-08-20",
    description:
      "Same no-vig consensus methodology applied to player props. Status is 'training' rather than 'beta' because " +
      "the props table is not yet populated — per-event player-prop odds ingestion is a documented next step " +
      "(see SETUP.md), not wired into the sync-odds cron job yet.",
  },
];

export async function getModels(): Promise<RunnerModel[]> {
  return models;
}
