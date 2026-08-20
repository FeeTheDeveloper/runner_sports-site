import Link from "next/link";
import { getGames } from "@/lib/data/games";
import { getProps } from "@/lib/data/props";
import { getEdges } from "@/lib/data/edges";
import { getMarketSignals } from "@/lib/data/signals";
import { getTrackerSummary } from "@/lib/data/tracker";
import StatCard from "@/components/dashboard/StatCard";
import GameCard from "@/components/sports/GameCard";
import PropCard from "@/components/sports/PropCard";
import EdgeCard from "@/components/sports/EdgeCard";
import SectionHeader from "@/components/ui/SectionHeader";
import SportsTable from "@/components/ui/SportsTable";
import Badge from "@/components/ui/Badge";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import TrendIndicator from "@/components/ui/TrendIndicator";
import EmptyState from "@/components/ui/EmptyState";
import { formatOdds, formatPercent, formatSignedPercent, formatCurrency } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const confidenceScore = { high: 1, moderate: 0.66, low: 0.33 } as const;

export default async function DashboardPage() {
  const [games, props, edges, signals, tracker] = await Promise.all([
    getGames(),
    getProps(),
    getEdges(),
    getMarketSignals(),
    getTrackerSummary(),
  ]);

  const upcomingGames = games.filter((g) => g.status !== "final").slice(0, 4);
  const topEdges = edges.slice(0, 5);
  const featuredProps = props.slice(0, 4);

  const activeMarkets = games.length * 3 + props.length;
  const topEdge = edges.reduce((max, e) => (e.edge > max.edge ? e : max), edges[0]);
  const confidenceValues = [...games.map((g) => g.confidence), ...props.map((p) => p.confidence)];
  const avgConfidence =
    confidenceValues.reduce((sum, c) => sum + confidenceScore[c], 0) / (confidenceValues.length || 1);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-text">Executive Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">
          Live sports intelligence overview, synced from The Odds API — no-vig market edges and tracked performance.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Games Today" value={upcomingGames.length} hint={`${games.length} tracked`} />
        <StatCard label="Active Markets" value={activeMarkets} hint="Across all sports" />
        <StatCard label="Top Model Edge" value={topEdge ? formatSignedPercent(topEdge.edge) : "—"} hint={topEdge?.selection} />
        <StatCard label="Avg. Confidence" value={formatPercent(avgConfidence, 0)} hint="Games + props" />
        <StatCard label="Tracked Bets" value={tracker.totalWagers} hint={`${tracker.pending} pending`} />
        <StatCard
          label="ROI"
          value={formatSignedPercent(tracker.roi)}
          trend={{ direction: tracker.roi >= 0 ? "up" : "down", label: `${tracker.wins}-${tracker.losses}-${tracker.pushes}` }}
        />
      </section>

      <section>
        <SectionHeader
          title="Today's Games"
          subtitle="Scheduled and live matchups with Runner win-probability projections"
          action={
            <Link href="/games" className="text-xs text-accent hover:underline">
              View all games →
            </Link>
          }
        />
        {upcomingGames.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <EmptyState title="No games scheduled" description="Check back closer to first pitch/kickoff." />
        )}
      </section>

      <section>
        <SectionHeader
          title="Top Runner Edges"
          subtitle="Ranked by no-vig consensus probability vs. a single book's price (RSA EDGE MODEL v0.1)"
          action={
            <Link href="/edge" className="text-xs text-accent hover:underline">
              Open Edge Board →
            </Link>
          }
        />
        <div className="hidden md:block">
          <SportsTable
            rowKey={(e) => e.id}
            rows={topEdges}
            columns={[
              { key: "rank", header: "#", render: (e) => <span className="font-mono text-text-subtle">{e.rank}</span> },
              {
                key: "event",
                header: "Event / Selection",
                render: (e) => (
                  <div>
                    <p className="text-text">{e.selection}</p>
                    <p className="text-xs text-text-subtle">
                      {e.event} · {e.market}
                    </p>
                  </div>
                ),
              },
              { key: "odds", header: "Odds", align: "right", render: (e) => <span className="font-mono">{e.odds !== undefined ? formatOdds(e.odds) : "—"}</span> },
              { key: "implied", header: "Implied", align: "right", render: (e) => <span className="font-mono">{formatPercent(e.impliedProbability)}</span> },
              { key: "model", header: "Runner", align: "right", render: (e) => <span className="font-mono text-accent">{formatPercent(e.modelProbability)}</span> },
              { key: "edge", header: "Edge", align: "right", render: (e) => <span className="font-mono text-positive">{formatSignedPercent(e.edge)}</span> },
              { key: "confidence", header: "Confidence", align: "right", render: (e) => <ConfidenceBadge confidence={e.confidence} compact /> },
            ]}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
          {topEdges.map((edge) => (
            <EdgeCard key={edge.id} edge={edge} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Player Prop Intelligence"
          subtitle="Representative Runner prop projections vs. posted lines"
          action={
            <Link href="/props" className="text-xs text-accent hover:underline">
              View all props →
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {featuredProps.map((prop) => (
            <PropCard key={prop.id} prop={prop} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <SectionHeader title="Market Signals" subtitle="Live line movement and no-vig consensus deltas" />
          <div className="space-y-3">
            {signals.map((signal) => (
              <div key={signal.id} className="rounded-lg border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text">{signal.event}</p>
                  <Badge variant="default" label={signal.market} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <TrendIndicator direction={signal.movement.direction}>
                    {signal.movement.openLine} → {signal.movement.currentLine}
                  </TrendIndicator>
                  <span className="text-text-muted">Consensus: {signal.movement.consensus}</span>
                  <span className={signal.modelMarketDelta >= 0 ? "text-positive font-mono" : "text-negative font-mono"}>
                    Δ {formatSignedPercent(signal.modelMarketDelta)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-text-subtle">{signal.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionHeader title="Recent Performance" subtitle="Live Runner Tracker results" />
          <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-subtle">Record</p>
                <p className="mt-1 font-mono text-lg text-text">
                  {tracker.wins}-{tracker.losses}-{tracker.pushes}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-subtle">Profit / Loss</p>
                <p className={`mt-1 font-mono text-lg ${tracker.totalProfit >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatCurrency(tracker.totalProfit)}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-subtle">ROI</p>
                <p className={`mt-1 font-mono text-lg ${tracker.roi >= 0 ? "text-positive" : "text-negative"}`}>
                  {formatSignedPercent(tracker.roi)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 text-center">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-subtle">Win Rate</p>
                <p className="mt-1 font-mono text-text">{formatPercent(tracker.winRate, 0)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-subtle">Avg. Odds</p>
                <p className="mt-1 font-mono text-text">{formatOdds(tracker.averageOdds)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-text-subtle">Avg. CLV</p>
                <p className="mt-1 font-mono text-text">{tracker.averageClv > 0 ? "+" : ""}{tracker.averageClv}%</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
