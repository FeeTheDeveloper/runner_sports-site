import RunnerScoreboardShell from "@/components/scoreboard/RunnerScoreboardShell";
import BaseDiamond from "@/components/scoreboard/mlb/BaseDiamond";
import MlbBoxScore from "@/components/scoreboard/mlb/MlbBoxScore";
import ScoreboardSpotlight from "@/components/scoreboard/ScoreboardSpotlight";
import ScoreboardIntelligencePanel from "@/components/scoreboard/ScoreboardIntelligencePanel";
import type { MlbScoreboardViewModel } from "@/types";

export default function ScoreboardMLB(viewModel: MlbScoreboardViewModel) {
  const { situation, inningRows, batter, pitcher, ...meta } = viewModel;

  return (
    <RunnerScoreboardShell
      {...meta}
      boxScore={<MlbBoxScore rows={inningRows} />}
      spotlights={
        <>
          <ScoreboardSpotlight spotlight={batter} />
          <ScoreboardSpotlight spotlight={pitcher} />
          <ScoreboardIntelligencePanel intelligence={meta.intelligence} />
        </>
      }
      situation={
        <>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted">{situation.inningLabel}</p>
          <BaseDiamond bases={situation.bases} />
          <div className="flex items-center gap-4">
            <span className="text-lg font-black text-text">{situation.count}</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              {situation.outs} out{situation.outs === 1 ? "" : "s"}
            </span>
          </div>
        </>
      }
    />
  );
}
