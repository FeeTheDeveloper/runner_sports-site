// Website price comparisons are delayed observations, never executable quotes.
// Match the 15-minute ingestion cadence with a bounded 20-minute read window.
export const MAX_QUOTE_AGE_MS = 20 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 60 * 1000;

export function isFreshQuote(capturedAt: string, now = Date.now()): boolean {
  const timestamp = Date.parse(capturedAt);
  return Number.isFinite(timestamp) && timestamp <= now + MAX_FUTURE_SKEW_MS && now - timestamp <= MAX_QUOTE_AGE_MS;
}

export function validAmericanOdds(odds: number): boolean {
  return Number.isFinite(odds) && Math.abs(odds) >= 100;
}

export interface ComparablePropQuote {
  sportsbook: string;
  line: number;
  overOdds: number;
  underOdds: number;
  capturedAt: string;
}

// Select the deepest exact-line group. Never pool probabilities for different
// thresholds, duplicate the same book, or turn absent prices into 50% estimates.
export function comparablePropQuotes<T extends ComparablePropQuote>(quotes: T[], now = Date.now()): T[] {
  const groups = new Map<number, Map<string, T>>();
  for (const quote of quotes) {
    if (!quote.sportsbook || !Number.isFinite(quote.line) || !isFreshQuote(quote.capturedAt, now) ||
        !validAmericanOdds(quote.overOdds) || !validAmericanOdds(quote.underOdds)) continue;
    const books = groups.get(quote.line) ?? new Map<string, T>();
    const key = quote.sportsbook.trim().toLowerCase();
    const prior = books.get(key);
    if (!prior || Date.parse(quote.capturedAt) > Date.parse(prior.capturedAt)) books.set(key, quote);
    groups.set(quote.line, books);
  }
  const best = [...groups.entries()].sort((a, b) => b[1].size - a[1].size || a[0] - b[0])[0];
  return best ? [...best[1].values()] : [];
}

export function oldestQuoteTime(quotes: { capturedAt: string }[]): string {
  return new Date(Math.min(...quotes.map((quote) => Date.parse(quote.capturedAt)))).toISOString();
}
