import { NextResponse, type NextRequest } from "next/server";
import type { SourceMetadata } from "@/types";
import { getEnv } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { fetchSportOdds, type EspnTeamIdentityProvider, type MappedGame } from "@/lib/providers/oddsApi";
import { getTeamIdentityProvider } from "@/lib/data/teamRegistry";
import { americanToImpliedProbability, computeConsensusProbability, computeEdge, devigTwoWay } from "@/lib/models/edgeCalculator";
import { authorizeCronRequest } from "../auth";

export const revalidate = 0;

const SPORT_SLUGS = ["nfl", "ncaaf", "nba", "wnba", "mlb", "nhl"] as const;

// Our domain types (Team, SourceMetadata, BookOddsSnapshot[], ...) are known
// to be plain JSON-serializable data, but don't structurally satisfy the
// generated `Json` index-signature type — this cast documents that gap
// rather than loosening it to `any`.
function toJson<T>(value: T): Json {
  return value as unknown as Json;
}

function movementId(gameId: string, market: string, sportsbook: string): string {
  return `${gameId}:${market}:${sportsbook}`.toLowerCase().replace(/\s+/g, "-");
}

interface MovementRow {
  id: string;
  event: string;
  market: string;
  sportsbook: string;
  opening_line: number | null;
  current_line: number | null;
  opening_price: number;
  current_price: number;
  direction: "up" | "down" | "flat";
  captured_at: string;
  source: SourceMetadata;
}

function buildMovementRows(game: MappedGame, eventLabel: string): MovementRow[] {
  const rows: MovementRow[] = [];
  for (const book of game.bookOdds) {
    if (book.spread) {
      rows.push({
        id: movementId(game.id, "spread", book.sportsbook),
        event: eventLabel,
        market: `${game.homeTeam.abbreviation} spread`,
        sportsbook: book.sportsbook,
        opening_line: book.spread.line,
        current_line: book.spread.line,
        opening_price: book.spread.home,
        current_price: book.spread.home,
        direction: "flat",
        captured_at: book.capturedAt,
        source: game.source,
      });
    }
    if (book.total) {
      rows.push({
        id: movementId(game.id, "total", book.sportsbook),
        event: eventLabel,
        market: "Game total",
        sportsbook: book.sportsbook,
        opening_line: book.total.line,
        current_line: book.total.line,
        opening_price: book.total.over,
        current_price: book.total.over,
        direction: "flat",
        captured_at: book.capturedAt,
        source: game.source,
      });
    }
  }
  return rows;
}

async function syncGames(apiKey: string, supabase: ReturnType<typeof getSupabaseServerClient>) {
  const results: Record<string, { games: number; movements: number; signals: number; error?: string }> = {};

  for (const slug of SPORT_SLUGS) {
    try {
      // Resolve team identities through the canonical registry when it has
      // been seeded by the ESPN sync; a registry outage must not block the
      // market feed, so fall back to derived identities on failure.
      let registry: EspnTeamIdentityProvider | undefined;
      try {
        registry = await getTeamIdentityProvider(slug);
      } catch {
        registry = undefined;
      }
      const games = await fetchSportOdds(slug, apiKey, registry);

      if (games.length > 0) {
        const { error: gamesError } = await supabase.from("games").upsert(
          games.map((game) => ({
            id: game.id,
            sport_id: game.sport.id,
            league: game.league,
            home_team: toJson(game.homeTeam),
            away_team: toJson(game.awayTeam),
            starts_at: game.startsAt,
            status: game.status,
            book_odds: toJson(game.bookOdds),
            key_factors: [],
            source: toJson(game.source),
            updated_at: new Date().toISOString(),
          })),
        );
        if (gamesError) throw gamesError;
      }

      let movementCount = 0;
      let signalCount = 0;

      for (const game of games) {
        const eventLabel = `${game.awayTeam.name} @ ${game.homeTeam.name}`;
        const candidateRows = buildMovementRows(game, eventLabel);
        if (candidateRows.length === 0) continue;

        const ids = candidateRows.map((r) => r.id);
        const { data: existingRows, error: fetchError } = await supabase
          .from("market_movements")
          .select("id, opening_line, opening_price, current_line, current_price")
          .in("id", ids);
        if (fetchError) throw fetchError;

        const existingById = new Map((existingRows ?? []).map((r) => [r.id, r]));

        const upsertRows = candidateRows.map((row) => {
          const existing = existingById.get(row.id);
          if (!existing) {
            return row;
          }
          const prevLine = existing.current_line ?? row.current_line;
          const direction: MovementRow["direction"] =
            row.current_line === null || prevLine === null
              ? "flat"
              : row.current_line > prevLine
                ? "up"
                : row.current_line < prevLine
                  ? "down"
                  : "flat";
          return {
            ...row,
            opening_line: existing.opening_line,
            opening_price: existing.opening_price,
            direction,
          };
        });

        const { error: upsertError } = await supabase
          .from("market_movements")
          .upsert(upsertRows.map((row) => ({ ...row, source: toJson(row.source) })));
        if (upsertError) throw upsertError;
        movementCount += upsertRows.length;

        // Signals: for the game total, compute a no-vig consensus fair
        // probability of "Over" across every book quoting it this sync, then
        // compare each individual book's own price against that consensus.
        // This is the RSA EDGE MODEL v0.1 methodology (lib/models/edgeCalculator.ts)
        // applied cross-sectionally across books — it is purely a function of
        // odds fetched this sync, not a fabricated "expert consensus" figure.
        const totalBooks = game.bookOdds.filter((b) => b.total);
        const consensusOverFair =
          totalBooks.length > 0
            ? computeConsensusProbability(
                totalBooks.map((b) => devigTwoWay(b.total!.over, b.total!.under).probabilityA),
              )
            : null;

        for (const book of game.bookOdds) {
          if (!book.total || consensusOverFair === null) continue;
          const movementRow = upsertRows.find(
            (r) => r.market === "Game total" && r.sportsbook === book.sportsbook,
          );
          if (!movementRow) continue;

          const thisBookImplied = americanToImpliedProbability(book.total.over);
          const delta = computeEdge(consensusOverFair, thisBookImplied);

          const { error: signalError } = await supabase.from("signals").upsert({
            id: `${movementId(game.id, "total", book.sportsbook)}-signal`,
            event: eventLabel,
            market: "Total",
            movement: toJson({
              direction: movementRow.direction,
              openLine: movementRow.opening_line,
              currentLine: movementRow.current_line,
              // No bettor-consensus/handle data source is connected yet;
              // this intentionally does NOT claim a betting-public percentage.
              consensus: "N/A — no bettor consensus/handle data source connected",
            }),
            model_market_delta: Math.round(delta * 1000) / 1000,
            note: `Total line ${movementRow.direction === "flat" ? "unchanged" : movementRow.direction === "up" ? "moved up" : "moved down"} at ${book.sportsbook} since last sync.`,
            updated_at: new Date().toISOString(),
          });
          if (signalError) throw signalError;
          signalCount += 1;
        }
      }

      results[slug] = { games: games.length, movements: movementCount, signals: signalCount };
    } catch (error) {
      results[slug] = {
        games: 0,
        movements: 0,
        signals: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return results;
}

async function handleSync(request: NextRequest) {
  const unauthorized = authorizeCronRequest(request);
  if (unauthorized) return unauthorized;

  const env = getEnv();
  const supabase = getSupabaseServerClient();
  const results = await syncGames(env.ODDS_API_KEY, supabase);

  return NextResponse.json({ data: results, syncedAt: new Date().toISOString() });
}

export async function GET(request: NextRequest) {
  return handleSync(request);
}

export async function POST(request: NextRequest) {
  return handleSync(request);
}
