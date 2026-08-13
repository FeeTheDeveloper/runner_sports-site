import { getEdges } from "@/lib/data/edges";
import EdgeBoard from "@/app/edge/EdgeBoard";

export default async function EdgePage() {
  const edges = await getEdges();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Runner Edge Board</h1>
        <p className="mt-1 text-sm text-text-muted">
          Ranked simulated opportunities where Runner model probability diverges from composite market pricing.
          Edge percentage reflects model probability minus market-implied probability.
        </p>
      </div>
      <EdgeBoard edges={edges} />
    </div>
  );
}
