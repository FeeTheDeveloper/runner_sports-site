import type { PerformanceBucket } from "@/types";

export default function PerformanceBreakdownTable({ title, buckets }: { title: string; buckets: PerformanceBucket[] }) {
  return (
    <div className="data-panel overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-text">{title}</h2>
      </div>
      <div className="p-5">
        {buckets.length === 0 ? (
          <p className="text-sm text-text-subtle">No settled bets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-text-subtle">
                  <th className="px-3 py-2 text-left">Label</th>
                  <th className="px-3 py-2 text-center">Bets</th>
                  <th className="px-3 py-2 text-center">W-L-CO</th>
                  <th className="px-3 py-2 text-right">Risked</th>
                  <th className="px-3 py-2 text-right">Profit</th>
                  <th className="px-3 py-2 text-right">ROI</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((bucket) => (
                  <tr key={bucket.label} className="border-b border-border last:border-none">
                    <td className="px-3 py-3 font-bold text-text">{bucket.label}</td>
                    <td className="px-3 py-3 text-center text-text-muted">{bucket.bets}</td>
                    <td className="px-3 py-3 text-center text-text-muted">
                      {bucket.wins}-{bucket.losses}-{bucket.cashouts}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-text">${bucket.risked.toFixed(2)}</td>
                    <td className={`px-3 py-3 text-right font-mono ${bucket.profit >= 0 ? "text-positive" : "text-negative"}`}>
                      {bucket.profit >= 0 ? "+" : ""}
                      ${bucket.profit.toFixed(2)}
                    </td>
                    <td className={`px-3 py-3 text-right font-mono ${bucket.roiPercent >= 0 ? "text-positive" : "text-negative"}`}>
                      {bucket.roiPercent >= 0 ? "+" : ""}
                      {bucket.roiPercent.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
