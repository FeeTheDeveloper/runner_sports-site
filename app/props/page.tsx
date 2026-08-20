import { getProps } from "@/lib/data/props";
import PropsExplorer from "@/app/props/PropsExplorer";

export const dynamic = "force-dynamic";

export default async function PropsPage() {
  const props = await getProps();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-text">Player Prop Intelligence</h1>
        <p className="mt-1 text-sm text-text-muted">
          No-vig consensus probability per prop. Empty for now — per-event player-prop odds ingestion isn&apos;t wired
          into the sync-odds cron job yet (see SETUP.md).
        </p>
      </div>
      <PropsExplorer props={props} />
    </div>
  );
}
