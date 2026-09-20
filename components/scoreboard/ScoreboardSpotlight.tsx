import { ScoreboardPanel, ScoreboardNoData } from "@/components/scoreboard/ScoreboardPanel";
import type { ScoreboardSpotlight as ScoreboardSpotlightData } from "@/types";

export default function ScoreboardSpotlight({ spotlight }: { spotlight?: ScoreboardSpotlightData }) {
  if (!spotlight) {
    return (
      <ScoreboardPanel title="Spotlight">
        <ScoreboardNoData />
      </ScoreboardPanel>
    );
  }

  return (
    <ScoreboardPanel title={spotlight.title}>
      <p className="text-xl font-black text-text">{spotlight.name}</p>
      {spotlight.detail && <p className="mt-1 text-sm text-text-muted">{spotlight.detail}</p>}
      {spotlight.line && <p className="mt-4 rounded-lg bg-canvas p-3 font-mono text-sm text-accent">{spotlight.line}</p>}
    </ScoreboardPanel>
  );
}
