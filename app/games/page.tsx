import { getGames } from "@/lib/data/games";
import GameCard from "@/components/sports/GameCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";

export default async function GamesPage() {
  const games = await getGames();
  const leagues = Array.from(new Set(games.map((g) => g.league)));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-text">Games</h1>
        <p className="mt-1 text-sm text-text-muted">
          Simulated slate with Runner win-probability projections and the key analytical factors behind each number.
        </p>
      </div>

      {leagues.length === 0 && <EmptyState title="No games available" description="Simulated slate is currently empty." />}

      {leagues.map((league) => {
        const leagueGames = games.filter((g) => g.league === league);
        return (
          <section key={league}>
            <SectionHeader title={league} subtitle={`${leagueGames.length} matchup${leagueGames.length === 1 ? "" : "s"}`} />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {leagueGames.map((game) => (
                <GameCard key={game.id} game={game} showFactors />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
