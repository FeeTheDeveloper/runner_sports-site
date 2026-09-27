import type { PlayerProp } from "@/types";
import PropCard from "@/components/sports/PropCard";

function pickFeaturedProp(props: PlayerProp[]): PlayerProp | null {
  if (props.length === 0) return null;
  return [...props].sort((a, b) => Math.abs(b.edge) - Math.abs(a.edge))[0] ?? props[0];
}

export default function PlayerPropSpotlight({ props }: { props: PlayerProp[] }) {
  const featured = pickFeaturedProp(props);


  return (
    <div>
      <div className="mx-auto max-w-md">
        {featured ? <PropCard prop={featured} /> : <p className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">No fresh comparable NFL prop quotes are available.</p>}
      </div>
    </div>
  );
}
