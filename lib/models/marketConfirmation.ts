import type { ConfirmedMarket, MarketConfirmationStatus } from "@/types";
import type { BookOddsSnapshot } from "@/lib/providers/oddsApi";
import { americanToImpliedProbability, devigTwoWay } from "@/lib/models/edgeCalculator";

interface Pair {
  sportsbook: string;
  point: number;
  over: number;
  under: number;
  capturedAt: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function betterPrice(a: number, b: number): number {
  return americanToImpliedProbability(a) < americanToImpliedProbability(b) ? a : b;
}

function statusFor(bookCount: number): MarketConfirmationStatus {
  if (bookCount >= 6) return "strong_consensus";
  if (bookCount >= 3) return "confirmed";
  return "thin";
}

/** Builds only comparable two-way O/U markets at the modal point. */
export function confirmDerivativeMarkets(bookOdds: BookOddsSnapshot[]): ConfirmedMarket[] {
  const groups = new Map<string, Pair[]>();
  for (const book of bookOdds) {
    for (const market of book.markets ?? []) {
      const participants = new Set(market.outcomes.map((outcome) => outcome.description ?? ""));
      for (const participant of participants) {
        const outcomes = market.outcomes.filter((outcome) => (outcome.description ?? "") === participant);
        const over = outcomes.find((outcome) => outcome.name.toLowerCase() === "over");
        const under = outcomes.find((outcome) => outcome.name.toLowerCase() === "under");
        if (!over || !under || over.point === undefined || under.point === undefined || over.point !== under.point) continue;
        const key = `${market.marketKey}\u0000${participant}\u0000${over.point}`;
        const pairs = groups.get(key) ?? [];
        pairs.push({ sportsbook: book.sportsbook, point: over.point, over: over.price, under: under.price, capturedAt: market.capturedAt });
        groups.set(key, pairs);
      }
    }
  }

  return Array.from(groups.entries()).map(([key, pairs]) => {
    const [marketKey, participant] = key.split("\u0000");
    const overFair = median(pairs.map((pair) => devigTwoWay(pair.over, pair.under).probabilityA));
    const medianOver = median(pairs.map((pair) => pair.over));
    const medianUnder = median(pairs.map((pair) => pair.under));
    const rawTotal = americanToImpliedProbability(medianOver) + americanToImpliedProbability(medianUnder);
    const bestOver = pairs.reduce((best, pair) => betterPrice(pair.over, best.over) === pair.over ? pair : best);
    const bestUnder = pairs.reduce((best, pair) => betterPrice(pair.under, best.under) === pair.under ? pair : best);
    return {
      marketKey,
      ...(participant ? { participant } : {}),
      point: pairs[0].point,
      bookCount: pairs.length,
      status: statusFor(pairs.length),
      bestOver: { sportsbook: bestOver.sportsbook, price: bestOver.over },
      bestUnder: { sportsbook: bestUnder.sportsbook, price: bestUnder.under },
      medianOverPrice: medianOver,
      medianUnderPrice: medianUnder,
      overround: Math.round((rawTotal - 1) * 10000) / 10000,
      noVigOverProbability: Math.round(overFair * 10000) / 10000,
      noVigUnderProbability: Math.round((1 - overFair) * 10000) / 10000,
      updatedAt: pairs.map((pair) => pair.capturedAt).sort().at(-1)!,
    } satisfies ConfirmedMarket;
  }).sort((a, b) => b.bookCount - a.bookCount || a.marketKey.localeCompare(b.marketKey));
}
