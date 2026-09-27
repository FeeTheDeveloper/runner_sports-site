import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getEdgeById, getEdges } from "@/lib/data/edges";
import { getGameById, getGames } from "@/lib/data/games";
import { getPropsByGame } from "@/lib/data/props";
import { getRunnerStatus } from "@/lib/data/runner";
import { getRunnerForecasts } from "@/lib/data/runnerForecasts";
import { getRunnerGameFlow } from "@/lib/data/runnerGameFlow";
import { getRunnerSignals } from "@/lib/data/runnerSignals";
import { getRunnerTotals } from "@/lib/data/runnerTotals";
import { getRunnerPickHealth } from "@/lib/data/runnerPickHealth";
import { getRunnerEvidence } from "@/lib/data/runnerEvidence";
import { getPredictionMarkets } from "@/lib/data/predictionMarkets";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://werunsportsandanalytics.com").replace(/\/$/, "");
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const;

function toolError(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search",
      {
        title: "Search Runner intelligence",
        description: "Find Runner games or delayed sportsbook consensus comparisons by team, league, sport, market, or selection. Consensus is not an independent model forecast.",
        inputSchema: z.object({ query: z.string().min(1).max(160) }),
        annotations: READ_ONLY,
      },
      async ({ query }) => {
        try {
          const [edges, games] = await Promise.all([getEdges({ query, limit: 12 }), getGames({ query, limit: 12 })]);
          const edgeResults = edges.slice(0, 8).map((edge) => ({ id: `edge:${edge.id}`, title: `${edge.selection} — ${edge.event}`, url: `${SITE_URL}/picks?edge=${encodeURIComponent(edge.id)}` }));
          const gameResults = games.slice(0, 8).map((game) => ({ id: `game:${game.id}`, title: `${game.awayTeam.name} @ ${game.homeTeam.name}`, url: `${SITE_URL}/games/${encodeURIComponent(game.id)}` }));
          return { content: [{ type: "text", text: JSON.stringify({ results: [...edgeResults, ...gameResults].slice(0, 12) }) }] };
        } catch {
          return toolError("Runner data is temporarily unavailable. The connector did not fabricate results.");
        }
      },
    );

    server.registerTool(
      "fetch",
      {
        title: "Fetch Runner intelligence",
        description: "Use this after search to retrieve the complete current Runner record for one game or play ID.",
        inputSchema: z.object({ id: z.string().min(1).max(220) }),
        annotations: READ_ONLY,
      },
      async ({ id }) => {
        try {
          if (id.startsWith("edge:")) {
            const edgeId = id.slice(5);
            const edge = await getEdgeById(edgeId);
            if (!edge) return toolError(`Runner play ${edgeId} was not found.`);
            return { content: [{ type: "text", text: JSON.stringify({ id, title: `${edge.selection} — ${edge.event}`, text: JSON.stringify(edge), url: `${SITE_URL}/picks?edge=${encodeURIComponent(edge.id)}`, metadata: { dataType: "calculation", source: edge.source, updatedAt: edge.updatedAt } }) }] };
          }

          if (id.startsWith("game:")) {
            const gameId = id.slice(5);
            const game = await getGameById(gameId);
            if (!game) return toolError(`Runner game ${gameId} was not found.`);
            const props = await getPropsByGame(gameId);
            return { content: [{ type: "text", text: JSON.stringify({ id, title: `${game.awayTeam.name} @ ${game.homeTeam.name}`, text: JSON.stringify({ ...game, props }), url: `${SITE_URL}/games/${encodeURIComponent(game.id)}`, metadata: { dataType: game.source.dataType, source: game.source.source, retrievedAt: game.source.retrievedAt } }) }] };
          }

          return toolError("Use an ID returned by Runner search, beginning with edge: or game:.");
        } catch {
          return toolError("Runner data is temporarily unavailable. The connector did not fabricate a record.");
        }
      },
    );

    server.registerTool(
      "get_best_plays",
      {
        title: "Get sportsbook consensus comparisons",
        description: "Read delayed no-vig market consensus deviations from displayed sportsbook prices. These are not independent model forecasts or verified executable opportunities. Never places a wager.",
        inputSchema: z.object({ sport: z.string().max(40).optional(), minimumEdge: z.number().min(0).max(1).default(0), limit: z.number().int().min(1).max(10).default(5) }),
        outputSchema: z.object({ plays: z.array(z.unknown()), methodology: z.string(), generatedAt: z.string() }),
        annotations: READ_ONLY,
      },
      async ({ sport, minimumEdge, limit }) => {
        try {
          const plays = await getEdges({ sport, minimumEdge, limit });
          const generatedAt = new Date().toISOString();
          const methodology = "Delayed no-vig multi-book consensus versus displayed sportsbook price, using comparable source quotes no older than 20 minutes. Not a trained or independently backtested win model; executable prices and fees are unverified.";
          return { structuredContent: { plays, methodology, generatedAt }, content: [{ type: "text", text: plays.length ? `Found ${plays.length} delayed consensus comparison${plays.length === 1 ? "" : "s"}. Review source timestamps and methodology.` : "No comparable recent quotes meet those filters. Runner did not manufacture a recommendation." }] };
        } catch {
          return toolError("Runner's play board is temporarily unavailable. No recommendation was generated.");
        }
      },
    );

    server.registerTool(
      "run_matchup_analysis",
      {
        title: "Run matchup analysis",
        description: "Use this when the user supplies a Runner game ID and wants the current matchup, market, probability, confidence, factors, and available props in one analysis packet.",
        inputSchema: z.object({ gameId: z.string().min(1).max(180) }),
        outputSchema: z.object({ game: z.unknown(), props: z.array(z.unknown()), limitations: z.array(z.string()), generatedAt: z.string() }),
        annotations: READ_ONLY,
      },
      async ({ gameId }) => {
        try {
          const game = await getGameById(gameId);
          if (!game) return toolError(`Runner game ${gameId} was not found.`);
          const props = await getPropsByGame(gameId);
          const generatedAt = new Date().toISOString();
          const limitations = ["Analytics only; no wager is placed.", "modelProbability is null because an independent forecast is unavailable; inspect noVigConsensusProbability and probabilityBasis for separate market consensus. A null consensus means unavailable.", "Book count is source coverage, not calibrated prediction confidence. Quotes are delayed and execution is unverified.", "Empty factors or props mean the source pipeline has not supplied verified data."];
          return { structuredContent: { game, props, limitations, generatedAt }, content: [{ type: "text", text: `Analysis packet ready for ${game.awayTeam.name} at ${game.homeTeam.name}. Source: ${game.source.source}; retrieved ${game.source.retrievedAt}.` }] };
        } catch {
          return toolError("Runner could not load that matchup. No analysis was fabricated.");
        }
      },
    );

    server.registerTool(
      "get_engine_status",
      {
        title: "Get Runner engine status",
        description: "Read bounded Runner engine and upstream provider health with freshness timestamps.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
      },
      async () => {
        try {
          return { structuredContent: await getRunnerStatus(), content: [{ type: "text", text: "Runner status loaded with source freshness." }] };
        } catch {
          return toolError("Runner status is temporarily unavailable.");
        }
      },
    );

    server.registerTool(
      "get_live_games",
      {
        title: "Get Runner live intelligence",
        description: "Read current bounded forecasts and game-flow records, optionally filtered by sport or event.",
        inputSchema: z.object({ sport: z.string().max(40).optional(), eventId: z.string().max(180).optional(), limit: z.number().int().min(1).max(50).default(25) }),
        annotations: READ_ONLY,
      },
      async ({ sport, eventId, limit }) => {
        try {
          const [forecasts, gameFlow] = await Promise.all([
            getRunnerForecasts({ sport, eventId, limit }),
            getRunnerGameFlow({ sport, eventId, limit }),
          ]);
          const freshness = forecasts.freshness.state === "STALE" || gameFlow.freshness.state === "STALE"
            ? "STALE"
            : forecasts.freshness.state === "DELAYED" || gameFlow.freshness.state === "DELAYED"
              ? "DELAYED"
              : forecasts.freshness.state === "OFFLINE" && gameFlow.freshness.state === "OFFLINE"
                ? "OFFLINE"
                : "FRESH";
          return { structuredContent: { forecasts: forecasts.data, gameFlow: gameFlow.data, freshness }, content: [{ type: "text", text: "Runner live intelligence loaded; review timestamps before relying on it." }] };
        } catch {
          return toolError("Runner live intelligence is temporarily unavailable.");
        }
      },
    );

    const boundedRunnerTool = (
      name: string,
      title: string,
      description: string,
      loader: (options: { sport?: string; eventId?: string; limit?: number }) => Promise<{ data: unknown[]; freshness: unknown }>,
    ) => {
      server.registerTool(
        name,
        {
          title,
          description,
          inputSchema: z.object({ sport: z.string().max(40).optional(), eventId: z.string().max(180).optional(), limit: z.number().int().min(1).max(50).default(25) }),
          annotations: READ_ONLY,
        },
        async ({ sport, eventId, limit }) => {
          try {
            const result = await loader({ sport, eventId, limit });
            return { structuredContent: result, content: [{ type: "text", text: `${title} loaded with bounded results and freshness metadata.` }] };
          } catch {
            return toolError(`${title} is temporarily unavailable.`);
          }
        },
      );
    };

    boundedRunnerTool("get_live_signals", "Get Runner signals", "Read current published Runner signals.", getRunnerSignals);
    boundedRunnerTool("get_totals", "Get Runner totals", "Read current published Runner totals projections.", getRunnerTotals);
    boundedRunnerTool("get_pick_health", "Get Runner pick health", "Read pick health and stale/blocked reasons.", getRunnerPickHealth);
    boundedRunnerTool("get_game_flow", "Get Runner game flow", "Read current published game-flow state.", getRunnerGameFlow);
    boundedRunnerTool("runner_research_evidence", "Get Runner research evidence", "Read bounded evidence records with source lineage.", getRunnerEvidence);

    server.registerTool(
      "get_prediction_markets",
      {
        title: "Get prediction markets",
        description: "Read bounded Kalshi and Polymarket sports market state.",
        inputSchema: z.object({ sport: z.string().max(40).optional(), limit: z.number().int().min(1).max(50).default(25) }),
        annotations: READ_ONLY,
      },
      async ({ sport, limit }) => {
        try {
          const markets = await getPredictionMarkets({ sport, limit });
          return { structuredContent: { markets }, content: [{ type: "text", text: "Prediction markets loaded with source timestamps." }] };
        } catch {
          return toolError("Prediction-market data is temporarily unavailable.");
        }
      },
    );

    server.registerTool(
      "get_provider_health",
      {
        title: "Get provider health",
        description: "Read bounded provider health records from the Runner engine.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(50).default(25) }),
        annotations: READ_ONLY,
      },
      async ({ limit }) => {
        try {
          const status = await getRunnerStatus();
          return { structuredContent: { providers: status.providers.slice(0, limit), freshness: status.freshness }, content: [{ type: "text", text: "Provider health loaded with freshness metadata." }] };
        } catch {
          return toolError("Provider health is temporarily unavailable.");
        }
      },
    );

    // Public MCP is read-only. Control tools require transport-bound identities,
    // per-command capabilities and durable approvals before they can return.
    // A shared bearer secret in model-visible tool arguments is not authority.
  },
  {
    serverInfo: { name: "runner-sports-intelligence", version: "0.3.0" },
    instructions: "Use Runner tools for sports research and published intelligence. Sportsbook comparisons are delayed no-vig market consensus, not independent forecasts. Preserve probabilityBasis and source timestamps, disclose unavailable independent models and unverified execution, and never invent plays or claim a wager was placed. Remote command tools are disabled.",
  },
);

export { handler as GET, handler as POST };
