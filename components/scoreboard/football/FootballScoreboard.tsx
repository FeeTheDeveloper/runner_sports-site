import RunnerScoreboardShell from "@/components/scoreboard/RunnerScoreboardShell";
import ScoreboardSpotlight from "@/components/scoreboard/ScoreboardSpotlight";
import ScoreboardIntelligencePanel from "@/components/scoreboard/ScoreboardIntelligencePanel";
import type { FootballScoreboardViewModel } from "@/types";

export default function FootballScoreboard(viewModel: FootballScoreboardViewModel) {
  const { situation, offense, defense, ...meta } = viewModel;
  const possessionTeam = situation.possession === "home" ? meta.homeTeam : situation.possession === "away" ? meta.awayTeam : undefined;

  return (
    <RunnerScoreboardShell
      {...meta}
      spotlights={
        <>
          <ScoreboardSpotlight spotlight={offense} />
          <ScoreboardSpotlight spotlight={defense} />
          <ScoreboardIntelligencePanel intelligence={meta.intelligence} />
        </>
      }
      situation={
        <>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-text-muted">{situation.quarterLabel}</p>
          {situation.clock && <p className="metric-number text-3xl font-black text-text">{situation.clock}</p>}
          {(situation.down || situation.distance) && (
            <p className="text-sm font-semibold text-text-muted">
              {[situation.down, situation.distance].filter(Boolean).join(" & ")}
              {situation.yardLine ? ` · ${situation.yardLine}` : ""}
            </p>
          )}
          {possessionTeam && (
            <p className="text-xs font-bold uppercase tracking-wider text-accent">Ball: {possessionTeam.abbreviation}</p>
          )}
        </>
      }
    />
  );
}
