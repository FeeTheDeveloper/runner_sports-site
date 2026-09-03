import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";
import RunnerTicker from "@/components/marketing/RunnerTicker";
import ResponsibleGamblingNotice from "@/components/legal/ResponsibleGamblingNotice";
import { getEdges } from "@/lib/data/edges";
import { getGames } from "@/lib/data/games";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const previewPlays = [
  { id: "preview-1", league: "NBA", event: "Featured Matchup", market: "Spread", selection: "Runner model watch", odds: -110, modelProbability: .604, impliedProbability: .524, edge: .08, confidence: "HIGH" },
  { id: "preview-2", league: "MLB", event: "Prime Time Board", market: "Moneyline", selection: "Market disagreement", odds: 125, modelProbability: .568, impliedProbability: .444, edge: .124, confidence: "HIGH" },
  { id: "preview-3", league: "NFL", event: "Sunday Slate", market: "Total", selection: "Runner total signal", odds: -105, modelProbability: .579, impliedProbability: .512, edge: .067, confidence: "MODERATE" },
];

const platforms = [
  ["01", "PICKS", "The strongest model-versus-market disagreements, ranked for action.", "/picks"],
  ["02", "ODDS", "Best-line comparison, no-vig consensus and live price movement.", "/odds"],
  ["03", "RESEARCH", "Teams, players, injuries, splits, trends and game intelligence.", "/research"],
  ["04", "SYSTEMS", "Historical angles, backtests, qualifiers, ROI and drawdown context.", "/systems"],
];

export default async function Home() {
  const [liveEdges, liveGames] = await Promise.all([getEdges().catch(() => []), getGames().catch(() => [])]);
  const plays = liveEdges.length ? liveEdges.slice(0, 3) : previewPlays;
  const isPreview = liveEdges.length === 0;
  return (
    <main className="min-h-dvh overflow-hidden bg-canvas">
      <nav className="relative z-30 border-b border-white/10 bg-[#020512]/90 backdrop-blur-xl" aria-label="Public navigation">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-10">
          <RunnerLogo />
          <div className="hidden items-center gap-7 lg:flex">{[["Best Plays", "#best-plays"], ["Live Events", "#events"], ["The Platform", "#platform"]].map(([label, href]) => <Link key={href} href={href} className="text-xs font-black uppercase tracking-widest text-text-muted transition hover:text-text">{label}</Link>)}</div>
          <div className="flex items-center gap-2"><Link href="/odds" className="hidden rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-text sm:block">View Odds</Link><Link href="/picks" className="rounded-lg bg-accent px-4 py-2 text-xs font-black text-white shadow-[0_0_30px_rgba(229,18,43,.3)]">ENTER COMMAND →</Link></div>
        </div>
      </nav>
      <RunnerTicker />

      <section className="hero-stadium relative border-b border-white/10">
        <div className="mx-auto grid min-h-[760px] max-w-[1500px] items-center gap-12 px-5 py-20 lg:grid-cols-[1.05fr_.95fr] lg:px-10">
          <div className="relative z-10">
            <p className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[.3em] text-analytics"><span className="h-px w-10 bg-analytics" /> Runner Sports &amp; Analytics</p>
            <h1 className="mt-7 max-w-4xl text-[clamp(3.8rem,8vw,8.6rem)] font-black uppercase leading-[.78] tracking-[-.075em] text-white">WE RUN<br /><span className="runner-outline">SPORTS</span><br /><span className="text-accent">+ DATA.</span></h1>
            <p className="mt-9 max-w-2xl text-base font-medium leading-7 text-text-muted sm:text-lg">This is the command center for the people who need the full picture—market price, player context, matchup truth, model probability and the edge between them.</p>
            <div className="mt-9 flex flex-wrap gap-3"><Link href="/picks" className="hero-button-primary">SEE TODAY&apos;S BEST PLAYS</Link><Link href="/research" className="hero-button-secondary">OPEN RESEARCH CENTER</Link></div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-bold uppercase tracking-widest text-text-subtle"><span>ESPN Intelligence</span><span>The Odds API</span><span>Runner Models</span><span>Supabase History</span></div>
          </div>
          <div className="relative z-10 hidden lg:block"><MediaStage label="HERO SPORTS IMAGE / VIDEO" sport="GENERATED VISUAL PLACEHOLDER" className="aspect-[4/5]"><div className="absolute inset-x-7 bottom-7 grid grid-cols-3 gap-2"><HeroMetric label="LIVE EVENTS" value={String(liveGames.length || 24)} /><HeroMetric label="ACTIVE BOOKS" value="6+" /><HeroMetric label="DATA SIGNALS" value="LIVE" accent /></div></MediaStage></div>
        </div>
        <div className="hero-wordmark" aria-hidden="true">RUNNER</div>
      </section>

      <section id="best-plays" className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28">
        <SectionLead kicker="The Runner Board" title="BEST PLAYS OF THE DAY" copy="The strongest signals rise to the top. Every play keeps model probability, market probability, edge and confidence visible." action="OPEN ALL PICKS" href="/picks" />
        <div className="mt-10 grid gap-4 lg:grid-cols-3">{plays.map((play, index) => <article key={play.id} className="leader-card group"><div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.2em] text-text-subtle">#{index + 1} TODAY</span><span className="rounded-full border border-positive/20 bg-positive/10 px-2.5 py-1 text-[9px] font-black text-positive">{play.confidence} CONFIDENCE</span></div><div className="mt-8"><p className="text-xs font-black uppercase tracking-wider text-analytics">{play.league} · {play.market}</p><h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">{play.selection}</h3><p className="mt-2 text-sm text-text-muted">{play.event} · {formatOdds(play.odds ?? 0)}</p></div><div className="mt-8 grid grid-cols-3 gap-2"><Metric label="Runner" value={formatPercent(play.modelProbability)} /><Metric label="Market" value={formatPercent(play.impliedProbability)} /><Metric label="Edge" value={formatSignedPercent(play.edge)} edge /></div><Link href="/picks" className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-xs font-black uppercase tracking-wider text-text">See the breakdown <span className="text-accent transition group-hover:translate-x-1">→</span></Link></article>)}</div>
        {isPreview ? <p className="mt-4 text-[10px] uppercase tracking-widest text-text-subtle">Preview layout shown until the next qualifying live market sync.</p> : null}
      </section>

      <section id="events" className="border-y border-white/10 bg-[#050a1c]"><div className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28"><SectionLead kicker="Game Day Intelligence" title="THE EVENTS EVERYBODY IS WATCHING" copy="Feature the biggest games, fights, series and moments with generated campaign visuals tied directly to the intelligence center." action="VIEW FULL SLATE" href="/games" /><div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["PRIME TIME FOOTBALL", "COURTSIDE FEATURE", "BASEBALL NIGHT GAME", "FIGHT NIGHT MAIN EVENT"].map((event, index) => <MediaStage key={event} label={`EVENT VISUAL 0${index + 1}`} sport={event} className="aspect-[4/5]"><div className="absolute inset-x-5 bottom-5"><p className="text-[10px] font-black uppercase tracking-widest text-accent">Featured Event</p><h3 className="mt-2 text-xl font-black uppercase text-white">{event}</h3><p className="mt-2 text-xs text-text-muted">Matchup · odds · models · injuries · trends</p></div></MediaStage>)}</div></div></section>

      <section id="platform" className="mx-auto max-w-[1500px] px-5 py-20 lg:px-10 lg:py-28"><SectionLead kicker="Own The Information" title="LEADERSHIP, NOT MEMBERSHIP" copy="Runner is building the sports intelligence layer—not another picks page. Every product surface feeds the same decision system." /><div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 md:grid-cols-2 xl:grid-cols-4">{platforms.map(([number, title, copy, href]) => <Link key={title} href={href} className="group bg-canvas p-7 transition hover:bg-surface"><span className="font-mono text-xs text-accent">{number}</span><h3 className="mt-14 text-2xl font-black text-white">{title}</h3><p className="mt-3 min-h-20 text-sm leading-6 text-text-muted">{copy}</p><span className="mt-8 inline-block text-sm font-black text-accent transition group-hover:translate-x-1">ENTER →</span></Link>)}</div></section>

      <section className="relative overflow-hidden border-y border-accent/25 bg-accent"><div className="cta-stripes absolute inset-0 opacity-20" /><div className="relative mx-auto flex max-w-[1500px] flex-col gap-8 px-5 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-10"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-white/70">werunsportsandanalytics.com</p><h2 className="mt-2 text-4xl font-black uppercase tracking-tight text-white sm:text-6xl">THE NAME IS THE MISSION.</h2></div><Link href="/picks" className="shrink-0 rounded-xl bg-white px-6 py-4 text-sm font-black text-accent shadow-2xl">ENTER RUNNER COMMAND →</Link></div></section>
      <footer className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10"><div className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between"><RunnerLogo /><p className="text-xs font-black uppercase tracking-[.2em] text-text-subtle">WE RUN SPORTS AND DATA.</p></div><div className="pt-7"><ResponsibleGamblingNotice /><p className="mt-4 text-[10px] text-text-subtle">© 2026 Runners Sports &amp; Analytics LLC · Research and analytics only · Not a sportsbook</p></div></footer>
    </main>
  );
}

function SectionLead({ kicker, title, copy, action, href }: { kicker: string; title: string; copy: string; action?: string; href?: string }) { return <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.27em] text-accent">{kicker}</p><h2 className="mt-3 max-w-4xl text-4xl font-black uppercase leading-none tracking-[-.045em] text-white sm:text-6xl">{title}</h2><p className="mt-5 max-w-2xl text-sm leading-6 text-text-muted">{copy}</p></div>{action && href ? <Link href={href} className="shrink-0 text-xs font-black uppercase tracking-widest text-text underline decoration-accent decoration-2 underline-offset-8">{action} →</Link> : null}</div>; }
function Metric({ label, value, edge }: { label: string; value: string; edge?: boolean }) { return <div className="rounded-lg border border-white/10 bg-black/20 p-3"><p className="text-[9px] font-bold uppercase tracking-wider text-text-subtle">{label}</p><p className={`mt-1 font-mono text-lg font-black ${edge ? "text-positive" : "text-white"}`}>{value}</p></div>; }
function HeroMetric({ label, value, accent }: { label: string; value: string; accent?: boolean }) { return <div className="rounded-xl border border-white/10 bg-black/60 p-3 backdrop-blur"><p className="text-[8px] font-bold uppercase tracking-wider text-white/50">{label}</p><p className={`mt-1 text-lg font-black ${accent ? "text-positive" : "text-white"}`}>{value}</p></div>; }
function MediaStage({ label, sport, className, children }: { label: string; sport: string; className: string; children: React.ReactNode }) { return <div className={`media-stage relative overflow-hidden rounded-2xl border border-white/10 ${className}`}><div className="media-crosshair" /><div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.2em] text-white/70 backdrop-blur">{label}</div><div className="absolute inset-0 grid place-items-center"><div className="text-center opacity-35"><div className="mx-auto h-16 w-16 rounded-full border border-dashed border-white/50" /><p className="mt-4 text-[9px] font-black uppercase tracking-[.25em] text-white">{sport}</p></div></div>{children}</div>; }
