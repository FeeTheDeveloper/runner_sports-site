import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { getEdges } from "@/lib/data/edges";
import { getGameById, getGames } from "@/lib/data/games";
import { getPropsByGame } from "@/lib/data/props";

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://werunsportsandanalytics.com").replace(/\/$/, "");
const READ_ONLY = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const;

function searchable(value: unknown) {
  return JSON.stringify(value).toLowerCase();
}

function toolError(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

const handler = createMcpHandler(
  (server) => {
    server.registerTool(
      "search",
      {
        title: "Search Runner intelligence",
        description: "Use this when the user wants to find Runner games or model-versus-market plays by team, league, sport, market, or selection.",
        inputSchema: z.object({ query: z.string().min(1).max(160) }),
        annotations: READ_ONLY,
      },
      async ({ query }) => {
        try {
          const [edges, games] = await Promise.all([getEdges(), getGames()]);
          const needle = query.toLowerCase();
          const edgeResults = edges.filter((edge) => searchable(edge).includes(needle)).slice(0, 8).map((edge) => ({ id: `edge:${edge.id}`, title: `${edge.selection} — ${edge.event}`, url: `${SITE_URL}/picks?edge=${encodeURIComponent(edge.id)}` }));
          const gameResults = games.filter((game) => searchable(game).includes(needle)).slice(0, 8).map((game) => ({ id: `game:${game.id}`, title: `${game.awayTeam.name} @ ${game.homeTeam.name}`, url: `${SITE_URL}/games/${encodeURIComponent(game.id)}` }));
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
            const edge = (await getEdges()).find((entry) => entry.id === edgeId);
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
        title: "Get best plays",
        description: "Use this when the user asks for today's strongest Runner model-versus-market signals. This is analytics only and never places a wager.",
        inputSchema: z.object({ sport: z.string().max(40).optional(), minimumEdge: z.number().min(0).max(1).default(0), limit: z.number().int().min(1).max(10).default(5) }),
        outputSchema: z.object({ plays: z.array(z.unknown()), methodology: z.string(), generatedAt: z.string() }),
        annotations: READ_ONLY,
      },
      async ({ sport, minimumEdge, limit }) => {
        try {
          const plays = (await getEdges())
            .filter((edge) => (!sport || edge.sport.toLowerCase() === sport.toLowerCase() || edge.league.toLowerCase() === sport.toLowerCase()) && edge.edge >= minimumEdge)
            .slice(0, limit);
          const generatedAt = new Date().toISOString();
          const methodology = "Current no-vig multi-book consensus versus displayed market price. Baseline market-pricing signal; not a trained or independently backtested win model.";
          return { structuredContent: { plays, methodology, generatedAt }, content: [{ type: "text", text: plays.length ? `Found ${plays.length} current Runner play${plays.length === 1 ? "" : "s"}. Review methodology, freshness and risk before acting.` : "No live plays currently meet those filters. Runner did not manufacture a recommendation." }] };
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
          const limitations = ["Analytics only; no wager is placed.", "Model probability currently reflects a no-vig market consensus baseline.", "Empty factors or props mean the source pipeline has not supplied verified data."];
          return { structuredContent: { game, props, limitations, generatedAt }, content: [{ type: "text", text: `Analysis packet ready for ${game.awayTeam.name} at ${game.homeTeam.name}. Source: ${game.source.source}; retrieved ${game.source.retrievedAt}.` }] };
        } catch {
          return toolError("Runner could not load that matchup. No analysis was fabricated.");
        }
      },
    );
  },
  {
    serverInfo: { name: "runner-sports-intelligence", version: "0.2.0" },
    instructions: "Use Runner tools for sports analytics and model-versus-market research. Never claim a wager was placed. Preserve source timestamps, disclose the baseline model limitation, and do not invent plays when data is unavailable.",
  },
);

export { handler as GET, handler as POST };
