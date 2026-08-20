import { getTrackedBets, getTrackerSummary } from "@/lib/data/tracker";
import StatCard from "@/components/dashboard/StatCard";
import PerformanceChart from "@/components/charts/PerformanceChart";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";
import type { TrackedBet } from "@/types";

export const dynamic = "force-dynamic";

function sportBreakdown(bets: TrackedBet[]) {
  const sports = Array.from(new Set(bets.map((b) => b.sport)));
  return sports.map((sport) => {
    const settled = bets.filter((b) => b.sport === sport && b.result !== "pending");
    const wins = settled.filter((b) => b.result === "win").length;
    const losses = settled.filter((b) => b.result === "loss").length;
    const pushes = settled.filter((b) => b.result === "push").length;
    const staked = settled.reduce((sum, b) => sum + b.stake, 0);
    const profit = settled.reduce((sum, b) => sum + b.profit, 0);
    const roi = staked > 0 ? profit / staked : 0;
    return {
      sport,
      record: `${wins}-${losses}${pushes > 0 ? `-${pushes}` : ""}`,
      roi,
      tone: roi > 0 ? "text-positive" : roi < 0 ? "text-negative" : "text-text-muted",
    };
  });
}

function cumulativeProfitSeries(bets: TrackedBet[]) {
  const settled = [...bets]
    .filter((b) => b.result !== "pending")
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  let running = 0;
  const values: number[] = [];
  const labels: string[] = [];
  for (const bet of settled) {
    running += bet.profit / 100;
    values.push(Math.round(running * 100) / 100);
    labels.push(formatDate(bet.date));
  }
  return { values, labels };
}

function closingLineInsight(bets: TrackedBet[]) {
  const withClv = bets.filter((b) => typeof b.clv === "number");
  if (withClv.length === 0) {
    return { value: "No CLV data yet", copy: "Log bets with a closingOdds value to start tracking closing-line value." };
  }
  const positive = withClv.filter((b) => (b.clv ?? 0) > 0).length;
  return {
    value: `${Math.round((positive / withClv.length) * 100)}% positive CLV`,
    copy: `${positive} of ${withClv.length} settled bets with recorded closing odds beat the closing number.`,
  };
}

function strongestMarketInsight(bets: TrackedBet[]) {
  const settled = bets.filter((b) => b.result !== "pending");
  const markets = Array.from(new Set(settled.map((b) => b.market)));
  if (markets.length === 0) {
    return { value: "No settled bets yet", copy: "Strongest market appears once bets are logged and settled." };
  }
  const ranked = markets
    .map((market) => {
      const marketBets = settled.filter((b) => b.market === market);
      const staked = marketBets.reduce((sum, b) => sum + b.stake, 0);
      const profit = marketBets.reduce((sum, b) => sum + b.profit, 0);
      return { market, roi: staked > 0 ? profit / staked : 0, count: marketBets.length };
    })
    .sort((a, b) => b.roi - a.roi);
  const top = ranked[0];
  return {
    value: top.market,
    copy: `${formatSignedPercent(top.roi)} ROI across ${top.count} settled bet${top.count === 1 ? "" : "s"}. Small samples are not statistically significant.`,
  };
}

export default async function AnalyticsPage() {
  const [summary, bets] = await Promise.all([getTrackerSummary(), getTrackedBets()]);
  const breakdowns = sportBreakdown(bets);
  const { values, labels } = cumulativeProfitSeries(bets);
  const closingLine = closingLineInsight(bets);
  const strongestMarket = strongestMarketInsight(bets);

  return (
    <div className="space-y-8">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Personal intelligence</p><h1 className="mt-2 text-2xl font-semibold text-text">Performance Analytics</h1><p className="mt-1 text-sm text-text-muted">Results, efficiency, and closing-line performance computed from your logged bets — empty until you log some via POST /api/tracker.</p></div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Bets" value={summary.totalWagers} hint={`${summary.pending} pending`} /><StatCard label="Win Rate" value={formatPercent(summary.winRate)} hint={`${summary.wins}-${summary.losses}-${summary.pushes}`} /><StatCard label="Units Won" value={`${summary.unitsWonLost >= 0 ? "+" : ""}${summary.unitsWonLost}`} /><StatCard label="Net Profit" value={formatCurrency(summary.totalProfit)} /><StatCard label="ROI" value={formatSignedPercent(summary.roi)} /><StatCard label="Avg CLV" value={`${summary.averageClv >= 0 ? "+" : ""}${summary.averageClv}%`} hint={`Avg ${formatOdds(summary.averageOdds)}`} />
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <PerformanceChart values={values} labels={labels} />
        <section className="runner-card p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-text">Performance by Sport</p><p className="mt-1 text-xs text-text-muted">Settled logged wagers</p></div><Badge label="CALC" variant="accent" /></div><div className="mt-5 divide-y divide-border">{breakdowns.length > 0 ? breakdowns.map((row) => <div key={row.sport} className="flex items-center justify-between py-3 text-sm"><span className="font-semibold text-text">{row.sport}</span><span className="font-mono text-text-muted">{row.record}</span><span className={`font-mono ${row.tone}`}>{formatSignedPercent(row.roi)}</span></div>) : <p className="py-3 text-sm text-text-muted">No bets logged yet.</p>}</div></section>
      </div>
      <section className="grid gap-4 md:grid-cols-3"><Insight title="Closing Line" value={closingLine.value} copy={closingLine.copy} /><Insight title="Strongest Market" value={strongestMarket.value} copy={strongestMarket.copy} /><Insight title="Model Attribution" value="Awaiting history" copy="Model-level validation activates when outputs are versioned and settled against real results." /></section>
    </div>
  );
}

function Insight({ title, value, copy }: { title: string; value: string; copy: string }) { return <article className="runner-card p-5"><p className="text-[10px] uppercase tracking-wider text-text-subtle">{title}</p><p className="mt-3 font-mono text-lg text-accent">{value}</p><p className="mt-2 text-xs leading-5 text-text-muted">{copy}</p></article> }
