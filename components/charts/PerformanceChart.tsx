interface PerformanceChartProps { values: number[]; labels: string[] }

export default function PerformanceChart({ values, labels }: PerformanceChartProps) {
  const latest = values.length > 0 ? values[values.length - 1] : 0;
  const latestLabel = `${latest >= 0 ? "+" : ""}${latest.toFixed(2)}u`;
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const points =
    values.length > 1
      ? values.map((value, index) => `${(index / (values.length - 1)) * 100},${92 - ((value - min) / range) * 76}`).join(" ")
      : "";
  return (
    <div className="runner-card p-5">
      <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-text">Bankroll Performance</p><p className="mt-1 text-xs text-text-muted">Cumulative profit (units) across settled bets</p></div><span className="font-mono text-sm text-accent">{latestLabel}</span></div>
      {points ? (
        <svg viewBox="0 0 100 100" className="mt-6 h-52 w-full" preserveAspectRatio="none" role="img" aria-label={`Cumulative profit trend ending at ${latestLabel}`}>
          {[16, 41, 66, 92].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--color-border)" strokeWidth=".5" />)}
          <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
      ) : (
        <p className="mt-6 h-52 flex items-center justify-center text-xs text-text-subtle">Not enough settled bets yet to plot a trend.</p>
      )}
      <div className="flex justify-between text-[10px] text-text-subtle">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}
