"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import DataStatusBadge from "@/components/ui/DataStatusBadge";
import RunnerLogo from "@/components/brand/RunnerLogo";

const productNav = [
  ["Picks", "/picks"],
  ["Odds", "/odds"],
  ["Tools", "/systems"],
  ["Research", "/research"],
  ["Models", "/models"],
  ["Prediction Markets", "/prediction-markets"],
];

const sports = ["For You", "MLB", "NFL", "NBA", "NCAAF", "WNBA", "NHL", "UFC", "Golf"];

export default function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-canvas/95 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-3 px-4 md:px-6 xl:px-8">
        <div className="md:hidden"><RunnerLogo compact /></div>
        <nav className="hidden items-stretch self-stretch lg:flex" aria-label="Primary navigation">
          {productNav.map(([label, href]) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return <Link key={href} href={href} className={`relative flex items-center px-3 text-xs font-semibold transition ${active ? "text-text" : "text-text-muted hover:text-text"}`}>{label}{active ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-accent shadow-[0_0_10px_var(--color-accent)]" /> : null}</Link>;
          })}
        </nav>
        <div className="flex items-center gap-2">
          <button aria-label="Search Runner" className="hidden min-h-10 rounded-lg border border-border bg-surface px-3 text-xs text-text-muted transition hover:border-border-strong hover:text-text sm:block">Search teams, players, markets <kbd className="ml-4 font-mono text-[10px] text-text-subtle">/</kbd></button>
          <DataStatusBadge />
          <button aria-label="Open alerts" className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-surface text-sm text-text-muted">◎</button>
          <button aria-label="Open profile" className="grid h-10 w-10 place-items-center rounded-full border border-border-strong bg-surface text-xs font-semibold text-accent">RS</button>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 md:px-6 xl:px-8" aria-label="Sport navigation">
        {sports.map((sport, index) => <Link key={sport} href={index === 0 ? "/picks" : `/odds?sport=${sport.toLowerCase()}`} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${index === 0 && pathname === "/picks" ? "bg-accent text-white" : "text-text-muted hover:bg-surface-2 hover:text-text"}`}>{sport}</Link>)}
        <span className="px-2 py-1.5 text-[11px] text-text-subtle">More +</span>
      </nav>
    </header>
  );
}
