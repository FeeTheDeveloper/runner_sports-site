import type { PlayerProp } from "@/types";
import Image from "next/image";
import Badge from "@/components/ui/Badge";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import ProbabilityBar from "@/components/ui/ProbabilityBar";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

const MARKET_LABELS: Record<string, string> = {
  player_pass_yds: "Passing yards",
  player_rush_yds: "Rushing yards",
  player_reception_yds: "Receiving yards",
  player_points: "Points",
  player_rebounds: "Rebounds",
  player_assists: "Assists",
  batter_hits: "Hits",
  batter_total_bases: "Total bases",
  pitcher_strikeouts: "Pitcher strikeouts",
  player_shots_on_goal: "Shots on goal",
  player_total_saves: "Goalie saves",
};

function marketLabel(market: string): string {
  return MARKET_LABELS[market] ?? market.replaceAll("_", " ");
}

export default function PropCard({ prop }: { prop: PlayerProp }) {
  const isOverLean = prop.edge >= 0;
  const initials = prop.player.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="rounded-lg border border-border bg-surface p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-2 text-xs font-bold text-accent">
            {prop.player.headshotUrl ? (
              <Image src={prop.player.headshotUrl} alt="" fill sizes="44px" className="object-cover" />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text">{prop.player.name}</p>
            <p className="truncate text-xs text-text-muted">
              {prop.player.team ? `${prop.player.team} vs ${prop.opponent}` : prop.opponent}
              {prop.player.position ? ` · ${prop.player.position}` : ""}
            </p>
          </div>
        </div>
        <Badge variant="accent" label={prop.sport} />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-text-subtle">{marketLabel(prop.market)}</p>
          <p className="font-mono text-sm text-text">{prop.line}</p>
        </div>
        <div className="text-right font-mono text-xs">
          <p className={isOverLean ? "text-positive" : "text-text-muted"}>O {formatOdds(prop.overOdds)}</p>
          <p className={!isOverLean ? "text-positive" : "text-text-muted"}>U {formatOdds(prop.underOdds)}</p>
        </div>
      </div>

      <ProbabilityBar
        label={prop.projection !== undefined ? `Runner projection: ${prop.projection}` : "No-vig consensus probability"}
        value={prop.probability}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">
          Edge <span className={`font-mono ${isOverLean ? "text-positive" : "text-negative"}`}>{formatSignedPercent(prop.edge)}</span>
        </span>
        <span className="text-text-muted">
          Hit rate (L10){" "}
          <span className="font-mono text-text">
            {prop.recentHitRate !== undefined ? formatPercent(prop.recentHitRate, 0) : "—"}
          </span>
        </span>
        <ConfidenceBadge confidence={prop.confidence} compact />
      </div>

      {prop.matchupContext && (
        <p className="text-xs text-text-subtle border-t border-border pt-2">{prop.matchupContext}</p>
      )}
    </div>
  );
}
