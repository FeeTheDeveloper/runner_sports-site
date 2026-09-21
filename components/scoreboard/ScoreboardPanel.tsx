export function ScoreboardPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="data-panel overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-text">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

export function ScoreboardNoData({ children = "Awaiting verified live data." }: { children?: React.ReactNode }) {
  return <p className="text-sm text-text-subtle">{children}</p>;
}
