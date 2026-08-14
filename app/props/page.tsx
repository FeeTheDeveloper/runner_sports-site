import { getProps } from "@/lib/data/props";
import PropsExplorer from "@/app/props/PropsExplorer";

export default async function PropsPage() {
  const props = await getProps();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Player Prop Intelligence</h1>
        <p className="mt-1 text-sm text-text-muted">
          Simulated player prop projections, recent hit rates, and matchup context across the slate.
        </p>
      </div>
      <PropsExplorer props={props} />
    </div>
  );
}
