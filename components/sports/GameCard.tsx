import type { Game } from "@/types";
import Badge from "@/components/ui/Badge";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import ProbabilityBar from "@/components/ui/ProbabilityBar";
import { formatLine, formatOdds, formatTime } from "@/lib/utils/format";

interface GameCardProps {
  game: Game;
  showFactors?: boolean;
}

const statusVariant = {
  scheduled: "default",
  live: "success",
  final: "default",
} as const;

export default function GameCard({ game, showFactors = false }: GameCardProps) {
  const projectedTeam = [game.homeTeam, game.awayTeam].find((t) => t.id === game.runnerProjectedWinner);

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="accent" label={game.league} />
          <Badge variant={statusVariant[game.status]} label={game.status === "live" ? "LIVE" : formatTime(game.startsAt)} />
        </div>
        <ConfidenceBadge confidence={game.confidence} compact />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <TeamColumn label="Away" team={game.awayTeam} moneyline={game.moneyline.away} />
        <TeamColumn label="Home" team={game.homeTeam} moneyline={game.moneyline.home} />
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-surface-2 p-3 text-center font-mono text-xs">
        <MarketCell label="Spread" value={`${formatLine(game.spread.home)} (${formatOdds(game.spread.line)})`} />
        <MarketCell label="Total" value={`${game.total.line}`} />
        <MarketCell label="Moneyline" value={`${formatOdds(game.moneyline.home)}`} />
      </div>

      <ProbabilityBar
        label={`Runner projects ${projectedTeam?.abbreviation ?? "—"} to win`}
        value={game.modelProbability}
      />

      {showFactors && game.keyFactors.length > 0 && (
        <ul className="space-y-1 border-t border-border pt-3 text-xs text-text-muted">
          {game.keyFactors.map((factor) => (
            <li key={factor} className="flex gap-2">
              <span className="text-accent">·</span>
              {factor}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TeamColumn({ label, team, moneyline }: { label: string; team: Game["homeTeam"]; moneyline: number }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-text-subtle">{label}</p>
      <p className="text-sm font-semibold text-text truncate">{team.abbreviation}</p>
      <p className="text-xs text-text-muted">{team.record}</p>
      <p className="mt-1 font-mono text-xs text-text">{formatOdds(moneyline)}</p>
    </div>
  );
}

function MarketCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-text-subtle mb-1">{label}</p>
      <p className="text-text">{value}</p>
    </div>
  );
}
