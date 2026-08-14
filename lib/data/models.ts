import type { RunnerModel } from "@/types";

const mockModels: RunnerModel[] = [
  {
    id: "model-nfl-game-01",
    name: "RSA NFL GAME MODEL",
    version: "v1.0",
    sport: "NFL",
    target: "Win probability & spread coverage",
    status: "active",
    sampleSize: 2450,
    accuracy: 0.582,
    calibration: 0.94,
    roi: 0.041,
    lastUpdated: "2026-08-11",
    description:
      "Estimates game-level win probability from EPA splits, trench matchup grades, rest, and travel. Backtested on simulated historical seasons.",
  },
  {
    id: "model-nba-player-01",
    name: "RSA NBA PLAYER MODEL",
    version: "v1.0",
    sport: "NBA",
    target: "Player prop projections",
    status: "active",
    sampleSize: 18200,
    accuracy: 0.561,
    calibration: 0.91,
    roi: 0.038,
    lastUpdated: "2026-08-12",
    description:
      "Projects points, rebounds, assists, and combo props using usage rate, pace, and opponent defensive matchup profiles.",
  },
  {
    id: "model-mlb-run-01",
    name: "RSA MLB RUN MODEL",
    version: "v1.0",
    sport: "MLB",
    target: "Run totals & run line",
    status: "beta",
    sampleSize: 4100,
    accuracy: 0.547,
    calibration: 0.88,
    roi: 0.019,
    lastUpdated: "2026-08-09",
    description:
      "Simulates expected runs from starter xFIP, bullpen fatigue, park factors, and lineup handedness splits.",
  },
  {
    id: "model-prop-edge-01",
    name: "RSA PROP EDGE MODEL",
    version: "v1.0",
    sport: "Multi-Sport",
    target: "Cross-sport prop edge detection",
    status: "active",
    sampleSize: 31500,
    accuracy: 0.573,
    calibration: 0.92,
    roi: 0.052,
    lastUpdated: "2026-08-13",
    description:
      "Compares Runner player projections against composite market pricing to surface ranked edges for the Runner Edge Board.",
  },
  {
    id: "model-nhl-game-01",
    name: "RSA NHL GAME MODEL",
    version: "v0.9",
    sport: "NHL",
    target: "Win probability & puck line",
    status: "beta",
    sampleSize: 1680,
    accuracy: 0.539,
    calibration: 0.85,
    lastUpdated: "2026-08-07",
    description:
      "Early-stage model incorporating goaltending save percentage, special teams, and travel fatigue. Not yet promoted to active.",
  },
  {
    id: "model-nfl-player-02",
    name: "RSA NFL PLAYER MODEL",
    version: "v0.4",
    sport: "NFL",
    target: "Player prop projections",
    status: "training",
    sampleSize: 890,
    accuracy: 0.512,
    calibration: 0.71,
    lastUpdated: "2026-08-05",
    description:
      "In-training successor to prop projections currently sourced from the cross-sport Edge Model. Not yet promoted.",
  },
];

export async function getModels(): Promise<RunnerModel[]> {
  return mockModels;
}
