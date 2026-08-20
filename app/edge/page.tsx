import { getEdges } from "@/lib/data/edges";
import EdgeBoard from "@/app/edge/EdgeBoard";

export const dynamic = "force-dynamic";

export default async function EdgePage() {
  const edges = await getEdges();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Runner Edge Board</h1>
        <p className="mt-1 text-sm text-text-muted">
          Ranked by RSA EDGE MODEL v0.1: a no-vig consensus across every book quoting a market, compared against one
          book&apos;s own price. Edge percentage reflects that consensus probability minus the book&apos;s implied
          probability — a market-pricing signal, not a backtested prediction.
        </p>
      </div>
      <EdgeBoard edges={edges} />
    </div>
  );
}
