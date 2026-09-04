"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface FilterBarProps { sports?: string[]; markets?: string[]; showDate?: boolean; showSearch?: boolean }

export default function FilterBar({ sports = [], markets = [], showDate = true, showSearch = true }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const current = useSearchParams();
  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(current.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}${params.size ? `?${params}` : ""}`);
  }
  const field = "rounded-lg border border-border bg-canvas px-3 py-2 text-xs font-semibold text-text-muted outline-none focus:border-accent";
  return <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface/80 p-3">
    {sports.length > 0 && <select aria-label="Filter by sport" className={field} value={current.get("sport") ?? ""} onChange={(event) => setFilter("sport", event.target.value)}><option value="">All Sports</option>{sports.map((sport) => <option key={sport} value={sport.toLowerCase()}>{sport}</option>)}</select>}
    {markets.length > 0 && <select aria-label="Filter by market" className={field} value={current.get("market") ?? ""} onChange={(event) => setFilter("market", event.target.value)}><option value="">All Markets</option>{markets.map((market) => <option key={market} value={market.toLowerCase()}>{market}</option>)}</select>}
    {showDate && <select aria-label="Filter by date" className={field} value={current.get("window") ?? "7d"} onChange={(event) => setFilter("window", event.target.value)}><option value="today">Today</option><option value="7d">Next 7 Days</option><option value="all">All Upcoming</option></select>}
    {showSearch && <form className="ml-auto flex gap-2" action={pathname}><input type="hidden" name="sport" value={current.get("sport") ?? ""}/><input name="q" defaultValue={current.get("q") ?? ""} aria-label="Search matchup" placeholder="Search matchup" className={field}/><button className="rounded-lg bg-accent px-3 py-2 text-xs font-bold text-white" type="submit">Search</button></form>}
  </div>;
}
