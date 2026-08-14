import { getTrackerSummary } from "@/lib/data/tracker";
import StatCard from "@/components/dashboard/StatCard";
import PerformanceChart from "@/components/charts/PerformanceChart";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

const breakdowns = [
  { label: "NFL", record: "2–0", roi: "+62.5%", tone: "text-positive" },
  { label: "NBA", record: "1–0", roi: "+142.0%", tone: "text-positive" },
  { label: "MLB", record: "0–2", roi: "-100.0%", tone: "text-negative" },
  { label: "NHL", record: "0–0–1", roi: "0.0%", tone: "text-text-muted" },
];

export default async function AnalyticsPage() {
  const summary = await getTrackerSummary();
  return (
    <div className="space-y-8">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Personal intelligence</p><h1 className="mt-2 text-2xl font-semibold text-text">Performance Analytics</h1><p className="mt-1 text-sm text-text-muted">A demo view of results, efficiency, and closing-line performance from tracked decisions.</p></div>
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Bets" value={summary.totalWagers} hint={`${summary.pending} pending`} /><StatCard label="Win Rate" value={formatPercent(summary.winRate)} hint={`${summary.wins}-${summary.losses}-${summary.pushes}`} /><StatCard label="Units Won" value={`+${summary.unitsWonLost}`} /><StatCard label="Net Profit" value={formatCurrency(summary.totalProfit)} /><StatCard label="ROI" value={formatSignedPercent(summary.roi)} /><StatCard label="Avg CLV" value={`+${summary.averageClv}%`} hint={`Avg ${formatOdds(summary.averageOdds)}`} />
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <PerformanceChart values={[0, .91, .41, .98, .98, 1.54, 1.08]} labels={["Aug 7", "Aug 9", "Aug 11", "Aug 13"]} />
        <section className="runner-card p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-text">Performance by Sport</p><p className="mt-1 text-xs text-text-muted">Settled demo wagers</p></div><Badge label="CALC" variant="accent" /></div><div className="mt-5 divide-y divide-border">{breakdowns.map((row) => <div key={row.label} className="flex items-center justify-between py-3 text-sm"><span className="font-semibold text-text">{row.label}</span><span className="font-mono text-text-muted">{row.record}</span><span className={`font-mono ${row.tone}`}>{row.roi}</span></div>)}</div></section>
      </div>
      <section className="grid gap-4 md:grid-cols-3"><Insight title="Closing Line" value="67% positive CLV" copy="Four of six settled demo entries beat the closing number." /><Insight title="Strongest Market" value="Moneyline" copy="Early sample only; not statistically significant." /><Insight title="Model Attribution" value="Awaiting history" copy="Model-level validation activates when outputs are versioned." /></section>
    </div>
  );
}

function Insight({ title, value, copy }: { title: string; value: string; copy: string }) { return <article className="runner-card p-5"><p className="text-[10px] uppercase tracking-wider text-text-subtle">{title}</p><p className="mt-3 font-mono text-lg text-accent">{value}</p><p className="mt-2 text-xs leading-5 text-text-muted">{copy}</p></article> }
