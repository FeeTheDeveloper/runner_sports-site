import type { ReactNode } from "react";
import DataStatusBadge from "@/components/ui/DataStatusBadge";
import TeamLogo from "@/components/sports/TeamLogo";
import TrendIndicator from "@/components/ui/TrendIndicator";
import { ScoreboardPanel, ScoreboardNoData } from "@/components/scoreboard/ScoreboardPanel";
import type { ScoreboardMeta, ScoreboardTeam } from "@/types";

const LIVE_STATUSES = new Set(["live", "in_progress", "in progress"]);

export interface RunnerScoreboardShellProps extends ScoreboardMeta {
  situation: ReactNode;
  boxScore?: ReactNode;
  spotlights?: ReactNode;
}

export default function RunnerScoreboardShell({
  league,
  venue,
  location,
  date,
  status,
  awayTeam,
  homeTeam,
  situation,
  boxScore,
  trends = [],
  markets = [],
  stats = [],
  spotlights,
  nextUp,
  intelligence,
}: RunnerScoreboardShellProps) {
  const isLive = LIVE_STATUSES.has(String(status).toLowerCase());

  return (
    <section className="runner-card overflow-hidden">
      <header className="border-b border-border px-6 py-6 md:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-accent">{league} &middot; Runner Scoreboard</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-text md:text-3xl">
              {awayTeam.abbreviation} <span className="text-text-subtle">@</span> {homeTeam.abbreviation}
            </h1>
          </div>
          <DataStatusBadge label={`${intelligence.sourceLabel} · Updated ${intelligence.updatedAt}`} tone={isLive ? "live" : "warning"} />
        </div>
      </header>

      <div className="grid divide-y divide-border border-b border-border text-[11px] font-bold uppercase tracking-[0.18em] text-text-muted md:grid-cols-3 md:divide-x md:divide-y-0">
        <div className="px-6 py-3">{league}</div>
        <div className="px-6 py-3 text-center">{[venue, location].filter(Boolean).join(" · ") || "Venue pending"}</div>
        <div className="px-6 py-3 text-right text-text">
          {date} &middot; {String(status).toUpperCase()}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px_1fr]">
        <TeamHero team={awayTeam} side="away" />
        <div className="flex flex-col items-center justify-center gap-4 border-y border-border bg-surface px-6 py-8 lg:border-x lg:border-y-0">
          {situation}
        </div>
        <TeamHero team={homeTeam} side="home" />
      </div>

      <div className="grid gap-4 p-4 md:p-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          {boxScore}

          <div className="grid gap-4 xl:grid-cols-3">
            <ScoreboardPanel title="Game Trends">
              {trends.length ? (
                <div className="space-y-3">
                  {trends.map((trend, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <TrendIndicator direction={trend.direction} />
                      <span className="leading-relaxed text-text-muted">{trend.text}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ScoreboardNoData />
              )}
            </ScoreboardPanel>

            <ScoreboardPanel title="Market Intelligence">
              {markets.length ? (
                <div className="space-y-3">
                  {markets.map((market) => (
                    <div key={market.label} className="grid grid-cols-3 gap-2 border-b border-border pb-3 text-sm last:border-none last:pb-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">{market.label}</span>
                      <span className="text-center font-mono font-semibold text-text">{market.away}</span>
                      <span className="text-center font-mono font-semibold text-text">{market.home}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ScoreboardNoData />
              )}
            </ScoreboardPanel>

            <ScoreboardPanel title="Key Stats">
              {stats.length ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                    <span>Stat</span>
                    <span className="text-center">{awayTeam.abbreviation}</span>
                    <span className="text-center">{homeTeam.abbreviation}</span>
                  </div>
                  {stats.map((stat) => (
                    <div key={stat.label} className="grid grid-cols-3 border-t border-border pt-3 text-sm">
                      <span className="text-text-muted">{stat.label}</span>
                      <span className="text-center font-bold text-text">{stat.away}</span>
                      <span className="text-center font-bold text-text">{stat.home}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <ScoreboardNoData />
              )}
            </ScoreboardPanel>
          </div>
        </div>

        <aside className="space-y-4">
          {spotlights}
          {nextUp && (
            <ScoreboardPanel title="Next Up">
              <p className="text-lg font-black text-text">{nextUp.matchup}</p>
              <p className="mt-3 text-sm text-text-muted">{nextUp.time}</p>
              <p className="mt-1 text-sm text-text-subtle">{nextUp.venue}</p>
            </ScoreboardPanel>
          )}
        </aside>
      </div>
    </section>
  );
}

function TeamHero({ team, side }: { team: ScoreboardTeam; side: "away" | "home" }) {
  return (
    <div className={`p-6 md:p-8 ${side === "away" ? "signal-glow" : "blue-glow"}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <TeamLogo name={team.name} abbreviation={team.abbreviation} logoUrl={team.logoUrl} size="lg" />
          <div>
            {team.city && <p className="text-[10px] uppercase tracking-[0.24em] text-text-subtle">{team.city}</p>}
            <p className="text-xl font-black text-text md:text-2xl">{team.name}</p>
            {team.record && <p className="mt-1 text-sm text-text-muted">{team.record}</p>}
          </div>
        </div>
        <div className="metric-number text-5xl font-black text-text md:text-6xl">{team.score}</div>
      </div>
    </div>
  );
}
