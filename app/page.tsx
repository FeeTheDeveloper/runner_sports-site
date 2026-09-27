import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";
import ResponsibleGamblingNotice from "@/components/legal/ResponsibleGamblingNotice";
import GameDaySkinSelector from "@/components/theme/GameDaySkinSelector";
import GameDaySkinStudio from "@/components/theme/GameDaySkinStudio";
import { getEdges } from "@/lib/data/edges";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Runner Country | Sports Research & Game Day",
  description: "Meet the Runner Demon. Explore sports research, compare delayed market prices, and choose your Philadelphia game-day colors.",
};

const researchRoutes = [
  { label: "The board", title: "Read the market.", detail: "Compare sportsbook quotes with no-vig consensus. See the source and the age of each observation.", href: "/odds", action: "Compare odds", icon: "↗" },
  { label: "The matchup", title: "Find the context.", detail: "Move from games to player markets and available team information. Keep missing coverage in view.", href: "/research", action: "Open research", icon: "◎" },
  { label: "Your record", title: "Own the results.", detail: "Record your wagers in your private tracker and review your own results over time.", href: "/tracker", action: "Open tracker", icon: "↳" },
];

export default async function Home() {
  const board = await getEdges({ limit: 3 }).then((data) => ({ data, error: false }), () => ({ data: [], error: true }));
  return (
    <main className="runner-launch">
      <a href="#launch-main" className="launch-skip">Skip to content</a>
      <header className="launch-nav">
        <div className="launch-container launch-nav-inner">
          <RunnerLogo />
          <nav aria-label="Public navigation">
            <Link href="#market-board">The board</Link>
            <Link href="#game-day">Game-day skins</Link>
            <Link href="/sunday">Sunday HQ</Link>
          </nav>
          <Link href="/sign-in" className="launch-sign-in">Sign in <span aria-hidden="true">↗</span></Link>
        </div>
      </header>

      <section className="demon-hero" id="launch-main" aria-labelledby="hero-title">
        <div className="demon-hero-atmosphere" aria-hidden="true" />
        <div className="launch-container demon-hero-content">
          <div className="demon-hero-topline"><span>RUNNER SPORTS & ANALYTICS</span><span>RESEARCH / CULTURE / GAME DAY</span></div>
          <div className="demon-hero-copy">
            <p className="launch-eyebrow"><span aria-hidden="true" /> Welcome to Runner country</p>
            <h1 id="hero-title">GAME DAY.<br /><em>FULL THROTTLE.</em></h1>
            <p className="demon-hero-description">The energy of the parking lot. The focus of the research room. Your sports, your city, your view of the game.</p>
            <div className="launch-actions"><Link href="/picks" className="launch-button launch-button--primary">Explore the board <span aria-hidden="true">↗</span></Link><Link href="/sunday" className="launch-button launch-button--outline">Enter Sunday HQ</Link></div>
          </div>
          <figure className="demon-hero-art">
            <Image src="/brand/runner-demon.png" alt="Runner-branded Demon-inspired concept car in a dark garage, wrapped in the red, navy and silver Runner sports logo." width={1672} height={941} priority unoptimized sizes="(max-width: 767px) 110vw, 85vw" />
            <figcaption><span>THE RUNNER DEMON</span><span>Generated brand concept</span></figcaption>
          </figure>
          <div className="demon-hero-bottom"><span>THE ATTITUDE IS OURS.<br /><strong>THE COLORS ARE YOURS.</strong></span><GameDaySkinSelector compact /><a href="#game-day" className="launch-down" aria-label="Explore game-day skins">↓</a></div>
        </div>
      </section>

      <div className="launch-trustline"><div className="launch-container"><p>Research with a clear view of the limits.</p><span>Source timestamps</span><span>Delayed market quotes</span><span>No automated wagering</span></div></div>

      <section className="launch-container launch-section" id="game-day">
        <GameDaySkinStudio />
      </section>

      <section className="launch-research-band">
        <div className="launch-container launch-section">
          <div className="launch-section-heading"><div><p className="launch-eyebrow">Behind the attitude</p><h2>Put the game<br />in perspective.</h2></div><p>Bring your questions. Follow the prices, explore the available context, and keep a record of your decisions.</p></div>
          <div className="launch-research-grid">{researchRoutes.map((route) => <article key={route.href} className="launch-research-card"><div><span>{route.label}</span><span aria-hidden="true">{route.icon}</span></div><h3>{route.title}</h3><p>{route.detail}</p><Link href={route.href}>{route.action} <span aria-hidden="true">↗</span></Link></article>)}</div>
        </div>
      </section>

      <section className="launch-container launch-section" id="market-board">
        <div className="launch-section-heading"><div><p className="launch-eyebrow">A look at the market</p><h2>Evidence before<br />excitement.</h2></div><div><p>No-vig consensus is a calculation from sportsbook prices. Independent model forecasts and executable prices are unavailable.</p><Link href="/edge" className="launch-text-link">Open the price comparison board ↗</Link></div></div>
        {board.data.length > 0 ? <div className="launch-market-grid">{board.data.map((edge) => <article className="launch-market-card" key={edge.id}>
          <div className="launch-market-meta"><span>{edge.league} / {edge.market}</span><span>{edge.bookCount ?? "—"} books</span></div><h3>{edge.selection}</h3><p>{edge.event}</p>
          <dl><div><dt>No-vig consensus</dt><dd>{formatPercent(edge.noVigConsensusProbability)}</dd></div><div><dt>Book implied</dt><dd>{formatPercent(edge.impliedProbability)}</dd></div><div><dt>Price gap</dt><dd>{formatSignedPercent(edge.edge)}</dd></div></dl>
          <div className="launch-market-source"><span>{edge.sportsbook} {edge.odds === undefined ? "" : formatOdds(edge.odds)}</span><time dateTime={edge.updatedAt}>{new Date(edge.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })} CT</time></div>
          <p className="launch-market-limits">Delayed observation · Execution unverified · Risk unassessed</p>
        </article>)}</div> : <div className="launch-market-empty"><div className="launch-empty-symbol" aria-hidden="true">—</div><div><h3>{board.error ? "The market board is temporarily unavailable." : "No fresh qualifying price comparisons."}</h3><p>{board.error ? "Market data could not be loaded. Try the odds board again shortly." : "Missing, stale or unverified quotes stay off the board. Explore the research center while coverage updates."}</p></div><Link href={board.error ? "/odds" : "/research"} className="launch-button launch-button--outline">{board.error ? "Open odds board" : "Explore research"} <span aria-hidden="true">↗</span></Link></div>}
      </section>

      <section className="launch-finale"><div className="launch-container"><div><p className="launch-eyebrow">Meet us at headquarters</p><h2>SAME CITY.<br />YOUR OWN ANGLE.</h2><p>Matchups, player markets, and the Runner game-day experience in one place.</p></div><Link href="/sunday" className="launch-button launch-button--primary">Go to Sunday HQ <span aria-hidden="true">↗</span></Link></div></section>
      <footer className="launch-container launch-footer"><div><RunnerLogo /><nav aria-label="Footer navigation"><Link href="/pricing">Access</Link><Link href="/research">Research</Link><Link href="/sign-in">Sign in</Link></nav></div><ResponsibleGamblingNotice /><p>© 2026 Runner Sports & Analytics LLC. Research and analytics only. Fan-inspired themes do not imply team affiliation.</p></footer>
    </main>
  );
}
