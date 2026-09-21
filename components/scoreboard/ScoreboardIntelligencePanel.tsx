import { ScoreboardPanel } from "@/components/scoreboard/ScoreboardPanel";
import type { ScoreboardIntelligence } from "@/types";

export default function ScoreboardIntelligencePanel({ intelligence }: { intelligence: ScoreboardIntelligence }) {
  return (
    <ScoreboardPanel title="Runner Intelligence">
      <div className="space-y-3">
        <Metric label="Source" value={intelligence.sourceLabel} />
        <Metric label="Updated" value={intelligence.updatedAt} />
        <Metric label="Freshness" value={intelligence.freshness} />
      </div>
    </ScoreboardPanel>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 last:border-none last:pb-0">
      <span className="text-[10px] uppercase tracking-wider text-text-subtle">{label}</span>
      <span className="text-sm font-semibold text-text">{value}</span>
    </div>
  );
}
