import RunnerScoreboardShell from "@/components/scoreboard/RunnerScoreboardShell";
import ScoreboardSpotlight from "@/components/scoreboard/ScoreboardSpotlight";
import ScoreboardIntelligencePanel from "@/components/scoreboard/ScoreboardIntelligencePanel";
import type { NbaScoreboardViewModel } from "@/types";

export default function ScoreboardNBA(viewModel: NbaScoreboardViewModel) {
  const { situation, awayLeader, homeLeader, ...meta } = viewModel;

  return (
    <RunnerScoreboardShell
      {...meta}
      spotlights={
        <>
          <ScoreboardSpotlight spotlight={awayLeader} />
          <ScoreboardSpotlight spotlight={homeLeader} />
          <ScoreboardIntelligencePanel intelligence={meta.intelligence} />
        </>
      }
      situation={
        <>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted">{situation.periodLabel}</p>
          {situation.clock && <p className="metric-number text-3xl font-black text-text">{situation.clock}</p>}
          <div className="grid grid-cols-2 gap-6 text-center text-xs font-semibold uppercase tracking-wider text-text-muted">
            <span>
              Fouls {situation.awayFouls ?? "-"} / {situation.homeFouls ?? "-"}
            </span>
            <span>
              TO {situation.awayTimeouts ?? "-"} / {situation.homeTimeouts ?? "-"}
            </span>
          </div>
        </>
      }
    />
  );
}
