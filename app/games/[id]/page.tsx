import { notFound } from "next/navigation";
import ProductHeading from "@/components/ui/ProductHeading";
import GameDetailView from "@/components/games/GameDetailView";
import { getGameById } from "@/lib/data/games";
import { getPropsByGame } from "@/lib/data/props";

export const dynamic = "force-dynamic";

export default async function MatchupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, props] = await Promise.all([getGameById(id).catch(() => undefined), getPropsByGame(id).catch(() => [])]);
  if (!game) notFound();
  return (
    <div className="space-y-7">
      <ProductHeading
        eyebrow={`${game.league} Matchup Center`}
        title={`${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`}
        description={`${new Date(game.startsAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short", timeZone: "America/Chicago" })} CT · Full game, market, player, trend, model, injury, and news intelligence.`}
      />
      <GameDetailView game={game} props={props} />
    </div>
  );
}
