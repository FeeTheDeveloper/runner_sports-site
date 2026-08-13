import Link from "next/link";
import DataStatusBadge from "@/components/ui/DataStatusBadge";
import { navItems } from "@/components/navigation/nav-items";
import NavIcon from "@/components/navigation/NavIcon";

const pitch: Record<string, string> = {
  Dashboard: "One view across today's slate, ranked edges, and tracked performance.",
  Games: "Matchup intelligence with Runner win-probability projections and key factors.",
  Props: "Player prop projections, edges, and recent hit rates — filterable by sport and market.",
  Edge: "The ranked Runner Edge Board — where model probability diverges from the market.",
  Tracker: "Bet-performance analytics: record, ROI, CLV, and sport-level breakdowns.",
  Models: "The Runner model registry — versioned, scored, and transparently labeled.",
};

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl space-y-14 py-6">
      <section className="text-center space-y-5">
        <DataStatusBadge />
        <h1 className="text-3xl font-semibold tracking-tight text-text sm:text-4xl">Runner Sports &amp; Analytics</h1>
        <p className="mx-auto max-w-2xl text-sm text-text-muted sm:text-base">
          Sports intelligence, predictive modeling, market analytics, and bet tracking — built as one system,
          under one scoring language.
        </p>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-text-subtle">
          Data <span className="text-accent mx-2">→</span> Intelligence <span className="text-accent mx-2">→</span> Decisions
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="rounded-md bg-accent px-5 py-2.5 text-sm font-medium text-canvas hover:bg-accent-strong transition-colors"
          >
            Enter Dashboard
          </Link>
          <Link
            href="/edge"
            className="rounded-md border border-border-strong px-5 py-2.5 text-sm font-medium text-text hover:bg-surface-2 transition-colors"
          >
            View Edge Board
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong hover:bg-surface-2"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border-strong bg-surface-2 text-accent">
                <NavIcon name={item.icon} className="h-4 w-4" />
              </div>
              <p className="text-sm font-semibold text-text">{item.label}</p>
            </div>
            <p className="mt-3 text-xs text-text-muted">{pitch[item.label]}</p>
          </Link>
        ))}
      </section>

      <section className="rounded-lg border border-border bg-surface p-6 text-center">
        <p className="text-xs uppercase tracking-wide text-text-subtle">Phase 1 — Application Shell</p>
        <p className="mt-2 text-sm text-text-muted">
          All figures across this build are simulated to establish Runner Sports &amp; Analytics&apos; internal data
          contracts. Live sportsbook and sports-data connections are not yet wired in.
        </p>
      </section>
    </div>
  );
}
