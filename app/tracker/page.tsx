import { getTrackedBets, getTrackerSummary } from "@/lib/data/tracker";
import StatCard from "@/components/dashboard/StatCard";
import SectionHeader from "@/components/ui/SectionHeader";
import SportsTable from "@/components/ui/SportsTable";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatMoney, formatOdds, formatSignedPercent } from "@/lib/utils/format";
import type { TrackedBet } from "@/types";

export const dynamic = "force-dynamic";

const resultVariant = {
  win: "success",
  loss: "danger",
  push: "default",
  pending: "warning",
} as const;

function summarizeBySport(bets: TrackedBet[]) {
  const sports = Array.from(new Set(bets.map((b) => b.sport)));
  return sports.map((sport) => {
    const sportBets = bets.filter((b) => b.sport === sport && b.result !== "pending");
    const wins = sportBets.filter((b) => b.result === "win").length;
    const losses = sportBets.filter((b) => b.result === "loss").length;
    const staked = sportBets.reduce((sum, b) => sum + b.stake, 0);
    const profit = sportBets.reduce((sum, b) => sum + b.profit, 0);
    return {
      sport,
      wins,
      losses,
      profit,
      roi: staked > 0 ? profit / staked : 0,
    };
  });
}

export default async function TrackerPage() {
  const [bets, summary] = await Promise.all([getTrackedBets(), getTrackerSummary()]);
  const bySport = summarizeBySport(bets);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-text">Bet Tracker</h1>
        <p className="mt-1 text-sm text-text-muted">
          Live wager log backed by Supabase — log a bet via POST /api/tracker; this table starts empty until you do.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Wagers" value={summary.totalWagers} hint={`${summary.pending} pending`} />
        <StatCard label="Record" value={`${summary.wins}-${summary.losses}-${summary.pushes}`} />
        <StatCard label="Units W/L" value={`${summary.unitsWonLost > 0 ? "+" : ""}${summary.unitsWonLost}`} />
        <StatCard label="Total Profit" value={formatCurrency(summary.totalProfit)} />
        <StatCard label="ROI" value={formatSignedPercent(summary.roi)} />
        <StatCard label="Avg. CLV" value={`${summary.averageClv > 0 ? "+" : ""}${summary.averageClv}%`} hint={`Avg odds ${formatOdds(summary.averageOdds)}`} />
      </section>

      <section>
        <SectionHeader title="Sport Breakdown" subtitle="Settled wagers grouped by sport" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {bySport.map((row) => (
            <div key={row.sport} className="rounded-lg border border-border bg-surface p-4">
              <p className="text-xs text-text-subtle">{row.sport}</p>
              <p className="mt-1 font-mono text-sm text-text">
                {row.wins}-{row.losses}
              </p>
              <p className={`mt-1 font-mono text-xs ${row.profit >= 0 ? "text-positive" : "text-negative"}`}>
                {formatCurrency(row.profit)} · {formatSignedPercent(row.roi)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader title="Wager Log" subtitle="Most recent logged bets" />
        <div className="hidden md:block">
          <SportsTable
            rowKey={(b) => b.id}
            rows={bets}
            columns={[
              { key: "date", header: "Date", render: (b) => <span className="text-text-muted">{formatDate(b.date)}</span> },
              { key: "sport", header: "Sport", render: (b) => <Badge variant="accent" label={b.sport} /> },
              {
                key: "event",
                header: "Event / Selection",
                render: (b) => (
                  <div>
                    <p className="text-text">{b.selection}</p>
                    <p className="text-xs text-text-subtle">
                      {b.event} · {b.market}
                    </p>
                  </div>
                ),
              },
              { key: "book", header: "Book", render: (b) => <span className="text-text-muted">{b.sportsbook}</span> },
              { key: "odds", header: "Odds", align: "right", render: (b) => <span className="font-mono">{formatOdds(b.odds)}</span> },
              { key: "stake", header: "Stake", align: "right", render: (b) => <span className="font-mono">{formatMoney(b.stake)}</span> },
              {
                key: "result",
                header: "Result",
                render: (b) => <Badge variant={resultVariant[b.result]} label={b.result} />,
              },
              {
                key: "profit",
                header: "Profit",
                align: "right",
                render: (b) => (
                  <span className={`font-mono ${b.profit > 0 ? "text-positive" : b.profit < 0 ? "text-negative" : "text-text-muted"}`}>
                    {b.result === "pending" ? "—" : formatCurrency(b.profit)}
                  </span>
                ),
              },
              {
                key: "clv",
                header: "CLV",
                align: "right",
                render: (b) => (
                  <span className="font-mono text-text-muted">{b.clv !== undefined ? `${b.clv > 0 ? "+" : ""}${b.clv}%` : "—"}</span>
                ),
              },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
          {bets.map((bet) => (
            <div key={bet.id} className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="accent" label={bet.sport} />
                <Badge variant={resultVariant[bet.result]} label={bet.result} />
              </div>
              <p className="text-sm text-text">{bet.selection}</p>
              <p className="text-xs text-text-subtle">
                {bet.event} · {bet.market} · {formatDate(bet.date)}
              </p>
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-text-muted">{formatOdds(bet.odds)}</span>
                <span className="text-text-muted">Stake {formatMoney(bet.stake)}</span>
                <span className={bet.profit > 0 ? "text-positive" : bet.profit < 0 ? "text-negative" : "text-text-muted"}>
                  {bet.result === "pending" ? "Pending" : formatCurrency(bet.profit)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
