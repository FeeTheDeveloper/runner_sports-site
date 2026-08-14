interface PerformanceChartProps { values: number[]; labels: string[] }

export default function PerformanceChart({ values, labels }: PerformanceChartProps) {
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 100},${92 - ((value - min) / range) * 76}`).join(" ");
  return (
    <div className="runner-card p-5">
      <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-text">Bankroll Performance</p><p className="mt-1 text-xs text-text-muted">Cumulative simulated profit</p></div><span className="font-mono text-sm text-accent">+1.08u</span></div>
      <svg viewBox="0 0 100 100" className="mt-6 h-52 w-full" preserveAspectRatio="none" role="img" aria-label="Cumulative profit trend increasing from zero to 1.08 units">
        {[16, 41, 66, 92].map((y) => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--color-border)" strokeWidth=".5" />)}
        <polyline points={points} fill="none" stroke="var(--color-accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-[10px] text-text-subtle">{labels.map((label) => <span key={label}>{label}</span>)}</div>
    </div>
  );
}
