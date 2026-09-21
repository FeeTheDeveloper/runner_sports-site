interface RunnerPerformanceCardProps {
  title: string;
  totalBets: number;
  netProfit: number;
  roi: number;
  wins: number;
  losses: number;
  cashouts: number;
  source: string;
  verifiedAt: string;
}

export function RunnerPerformanceCard({
  title,
  totalBets,
  netProfit,
  roi,
  wins,
  losses,
  cashouts,
  source,
  verifiedAt,
}: RunnerPerformanceCardProps) {
  return (
    <section className="data-panel p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Runner Sports &amp; Analytics</p>
      <h2 className="mt-2 text-2xl font-black text-text">{title}</h2>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric label="Tracked Bets" value={String(totalBets)} />
        <Metric label="Net P/L" value={`${netProfit >= 0 ? "+" : ""}$${netProfit.toFixed(2)}`} tone={netProfit >= 0 ? "positive" : "negative"} />
        <Metric label="ROI" value={`${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`} tone={roi >= 0 ? "positive" : "negative"} />
        <Metric label="Record" value={`${wins}-${losses} · ${cashouts} CO`} />
      </div>

      <div className="mt-6 border-t border-border pt-4 text-xs text-text-subtle">
        Source: {source} &middot; Updated: {new Date(verifiedAt).toLocaleString()}
      </div>
    </section>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "positive" | "negative" }) {
  const toneClass = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "text-text";
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-text-subtle">{label}</p>
      <p className={`mt-1 metric-number text-xl font-black ${toneClass}`}>{value}</p>
    </div>
  );
}
