export default function FilterBar({ labels }: { labels: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/80 p-3">
      {labels.map((label, index) => (
        <button key={label} className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${index === 0 ? "border-accent/40 bg-accent/10 text-text" : "border-border bg-canvas text-text-muted hover:border-border-strong hover:text-text"}`}>
          {label} <span className="ml-2 text-[9px] text-text-subtle">⌄</span>
        </button>
      ))}
      <button className="ml-auto rounded-lg border border-border bg-canvas px-3 py-2 text-xs text-text-muted">Search matchup</button>
    </div>
  );
}
