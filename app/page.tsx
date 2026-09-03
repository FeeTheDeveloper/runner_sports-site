import Link from "next/link";
import Image from "next/image";
import RunnerLogo from "@/components/brand/RunnerLogo";
import NavIcon from "@/components/navigation/NavIcon";
import ResponsibleGamblingNotice from "@/components/legal/ResponsibleGamblingNotice";

const capabilities = [
  ["Game Intelligence", "Matchups, pricing, and model context organized for fast research.", "calendar"],
  ["Player Props", "Projection, recent form, matchup context, and market price in one view.", "target"],
  ["Runner Edge", "Transparent model probability compared directly with implied probability.", "trending"],
  ["Market Intelligence", "Opening numbers, current prices, and meaningful line movement.", "markets"],
  ["Bet Tracking", "A structured decision journal built for ROI and closing-line analysis.", "activity"],
  ["Performance Analytics", "Understand performance by sport, market, model, and time period.", "chart"],
];

export default function Home() {
  return (
    <main className="runner-grid min-h-dvh overflow-hidden bg-canvas">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8" aria-label="Public navigation">
        <RunnerLogo />
        <div className="flex items-center gap-3">
          <Link href="#intelligence" className="hidden text-sm text-text-muted transition hover:text-text sm:block">Platform</Link>
          <Link href="/dashboard" className="rounded-lg border border-accent/35 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20">Enter Dashboard</Link>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-32 lg:pt-24">
        <div className="relative z-10 max-w-3xl">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface/70 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Decision intelligence platform
          </p>
          <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-text sm:text-6xl lg:text-7xl">
            Sports intelligence.<br /><span className="text-accent">Built different.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-text-muted sm:text-lg">
            Transform markets, matchups, models, and betting performance into a single, disciplined research workflow.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/dashboard" className="rounded-lg bg-accent px-5 py-3 text-sm font-bold text-white shadow-[0_0_32px_rgba(229,18,43,0.28)] transition hover:bg-accent-strong">Enter Dashboard →</Link>
            <Link href="#intelligence" className="rounded-lg border border-border-strong bg-surface/60 px-5 py-3 text-sm font-semibold text-text transition hover:bg-surface-2">Explore Intelligence</Link>
          </div>
          <p className="mt-8 text-xs text-text-subtle">Independent analytics platform · No wagers accepted · Demo data clearly identified</p>
        </div>

        <div className="relative lg:pt-6" aria-label="Runner dashboard preview">
          <div className="absolute -inset-16 rounded-full bg-accent/10 blur-3xl" />
          <div className="runner-card relative overflow-hidden p-5">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-canvas"><Image src="/brand/icon.png" alt="" fill sizes="48px" className="object-cover" /></div>
                <div><p className="text-xs font-semibold text-text">Runner Edge Monitor</p><p className="mt-1 text-[10px] uppercase tracking-widest text-text-subtle">Demonstration workspace</p></div>
              </div>
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-[9px] font-semibold tracking-wider text-warning">SIMULATED</span>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[['MODEL PROB.', '58.7%'], ['MARKET PROB.', '52.4%'], ['RUNNER EDGE', '+6.3%']].map(([label, value], index) => (
                <div key={label} className="rounded-lg border border-border bg-surface-2 p-3">
                  <p className="text-[9px] tracking-wider text-text-subtle">{label}</p><p className={`mt-2 font-mono text-lg font-semibold ${index === 2 ? 'text-accent' : 'text-text'}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-border bg-surface-2 p-4">
              <div className="flex items-start justify-between"><div><p className="text-xs text-text-muted">NBA · Spread</p><p className="mt-1 text-sm font-semibold text-text">Boston -4.5</p></div><span className="rounded-full bg-accent/10 px-2 py-1 text-[10px] text-accent">HIGH CONFIDENCE</span></div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-canvas"><div className="h-full w-[74%] rounded-full bg-accent" /></div>
              <div className="mt-3 flex justify-between text-[10px] text-text-subtle"><span>Market comparison</span><span>Updated with demo snapshot</span></div>
            </div>
            <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-widest text-text-subtle"><span className="text-accent">Source</span><span>→</span><span className="text-accent">Model</span><span>→</span><span className="text-accent">Decision</span><span>→</span><span className="text-accent">Track</span></div>
          </div>
        </div>
      </section>

      <section id="intelligence" className="border-y border-border bg-surface/35">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">The intelligence stack</p>
          <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-text">Every stage of the decision, connected.</h2>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map(([title, description, icon]) => (
              <div key={title} className="bg-canvas p-6 transition hover:bg-surface">
                <NavIcon name={icon} className="h-5 w-5 text-accent" />
                <h3 className="mt-5 text-sm font-semibold text-text">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-text-subtle lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Runners Sports &amp; Analytics LLC</p><p>Research and analytics only. Not a sportsbook.</p>
        </div>
        <ResponsibleGamblingNotice />
      </footer>
    </main>
  );
}
