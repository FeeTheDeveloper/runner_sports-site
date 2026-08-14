export default function Loading() {
  return <div className="space-y-6" aria-label="Loading Runner intelligence"><div className="h-8 w-64 animate-pulse rounded-lg bg-surface-2" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-border bg-surface" />)}</div><div className="h-80 animate-pulse rounded-xl border border-border bg-surface" /></div>;
}
