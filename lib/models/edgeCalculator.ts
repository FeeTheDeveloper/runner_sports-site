// RSA EDGE MODEL v0.1
//
// Objective: surface where a specific sportsbook's price diverges from the
// no-vig consensus implied by all books quoting the same market, and rank
// how large that divergence is.
//
// This is a baseline heuristic, not a trained model. "Model probability" here
// means "no-vig consensus across the books we have odds for" — not a
// probability estimated from historical outcomes. It has not been backtested
// or calibrated against settled results. Treat any edge/confidence value it
// produces as a market-pricing signal, not a win prediction.
//
// Known weaknesses:
// - Consensus quality depends entirely on how many books are quoted for a
//   given market; a two-book consensus is noisy.
// - No adjustment for shading/limits at soft books vs. sharp books — every
//   quoted price is weighted equally.
// - Player-prop consensus assumes the same line across books; if books offer
//   different lines for the same prop, mixing their odds into one consensus
//   is not directly comparable (see computeConsensusProbability caveat below).

export interface BookPrice {
  sportsbook: string;
  odds: number; // American odds
  line?: number;
  capturedAt: string;
}

export function americanToImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return -odds / (-odds + 100);
}

/**
 * Removes the vig from a two-way market (e.g. over/under, or a moneyline
 * with exactly two sides) by normalizing each side's raw implied probability
 * so they sum to 1.
 */
export function devigTwoWay(
  oddsA: number,
  oddsB: number,
): { probabilityA: number; probabilityB: number } {
  const rawA = americanToImpliedProbability(oddsA);
  const rawB = americanToImpliedProbability(oddsB);
  const total = rawA + rawB;
  return { probabilityA: rawA / total, probabilityB: rawB / total };
}

/**
 * Consensus "fair" probability for one side of a market across every book
 * quoting it, computed as the mean of each book's devigged probability
 * against the field average of the other side. Requires at least one
 * opposing-side price to devig against; callers should filter to markets
 * where both sides were captured together.
 */
export function computeConsensusProbability(devuggedProbabilities: number[]): number {
  if (devuggedProbabilities.length === 0) {
    throw new Error("computeConsensusProbability requires at least one probability");
  }
  return devuggedProbabilities.reduce((sum, p) => sum + p, 0) / devuggedProbabilities.length;
}

export function computeEdge(modelProbability: number, marketImpliedProbability: number): number {
  return modelProbability - marketImpliedProbability;
}

export function classifyConfidence(sampleBookCount: number): "low" | "moderate" | "high" {
  if (sampleBookCount >= 5) return "high";
  if (sampleBookCount >= 3) return "moderate";
  return "low";
}
