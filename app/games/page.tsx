import { getGames } from "@/lib/data/games";
import GameCard from "@/components/sports/GameCard";
import SectionHeader from "@/components/ui/SectionHeader";
import EmptyState from "@/components/ui/EmptyState";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const games = await getGames();
  const leagues = Array.from(new Set(games.map((g) => g.league)));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-text">Games</h1>
        <p className="mt-1 text-sm text-text-muted">
          Live slate synced from The Odds API, with a no-vig consensus win probability computed across every book
          quoting each game.
        </p>
      </div>

      {leagues.length === 0 && (
        <EmptyState
          title="No games available"
          description="No games synced yet — set ODDS_API_KEY and CRON_SECRET, then trigger the sync-odds cron job."
        />
      )}

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
