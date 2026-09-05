import ProductHeading from "@/components/ui/ProductHeading";
import PlayersExplorer from "@/app/players/PlayersExplorer";
import { getProps } from "@/lib/data/props";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const props = await getProps().catch(() => []);
  const players = Array.from(new Map(props.map((prop) => [prop.player.id, prop.player])).values());

  return (
    <div className="space-y-7">
      <ProductHeading
        eyebrow="Player Lab"
        title="Player Intelligence"
        description="Live athlete identities connected to posted props, team context, market history, and Runner analysis."
      />
      <PlayersExplorer players={players} />
    </div>
  );
}
