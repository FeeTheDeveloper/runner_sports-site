import type { Game } from "@/types";
import GameCard from "@/components/sports/GameCard";

function pickGameOfTheDay(games: Game[]): Game | null {
  if (games.length === 0) return null;
  const live = games.find((g) => g.status === "live");
  if (live) return live;
  return [...games].sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0] ?? games[0];
}

export default function GameOfTheDay({ games }: { games: Game[] }) {
  const featured = pickGameOfTheDay(games);


  return (
    <div>
      <div className="mx-auto max-w-md">
        {featured ? <GameCard game={featured} showFactors /> : <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">No verified NFL matchup is available.</p>}
      </div>
    </div>
  );
}
