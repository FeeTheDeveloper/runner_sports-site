import type { Metadata } from "next";
import Link from "next/link";
import RunnerLogo from "@/components/brand/RunnerLogo";
import RunnerTicker from "@/components/marketing/RunnerTicker";
import ResponsibleGamblingNotice from "@/components/legal/ResponsibleGamblingNotice";
import SundayHeadquartersHero from "@/components/sunday/SundayHeadquartersHero";
import PresentedByRail from "@/components/sunday/PresentedByRail";
import VeteranVendorSpotlight from "@/components/sunday/VeteranVendorSpotlight";
import GameOfTheDay from "@/components/sunday/GameOfTheDay";
import PlayerPropSpotlight from "@/components/sunday/PlayerPropSpotlight";
import KalshiMarketWatch from "@/components/sunday/KalshiMarketWatch";
import RunnerLiveDesk from "@/components/sunday/RunnerLiveDesk";
import HalftimeReport from "@/components/sunday/HalftimeReport";
import RunnerQuickFlip from "@/components/sunday/RunnerQuickFlip";
import FinalResultsAccountability from "@/components/sunday/FinalResultsAccountability";
import SponsorCtaPanelView from "@/components/sunday/SponsorCtaPanel";
import { getGames } from "@/lib/data/games";
import { getProps } from "@/lib/data/props";
import { getEdges } from "@/lib/data/edges";
import { getPredictionMarkets } from "@/lib/data/predictionMarkets";
import { getTrackedBets, getTrackerSummary } from "@/lib/data/tracker";
import {
  CTA_SPONSOR_PANELS,
  HALFTIME_REPORT,
  LIVE_DESK_NOTES,
  PRESENTED_BY_SPONSOR,
  SPONSOR_LOGO_RAIL,
  VETERAN_VENDOR_SPOTLIGHT,
} from "@/lib/sunday/content";
import type { TrackedBet, TrackerSummary } from "@/types";

export const metadata: Metadata = {
  title: "Runner Sunday Headquarters",
  description: "The NFL Sunday activation command center — Runner's market research board, live desk, halftime recap and sponsor spotlights in one place.",
};

export const dynamic = "force-dynamic";

const EMPTY_SUMMARY: TrackerSummary = {
  totalWagers: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  pending: 0,
  unitsWonLost: 0,
  totalProfit: 0,
  roi: 0,
  winRate: 0,
  averageOdds: 0,
  averageClv: 0,
};

export default async function SundayHeadquartersPage() {
  const [games, props, edges, kalshiMarkets, trackerSummary, trackedBets] = await Promise.all([
    getGames({ sport: "NFL", limit: 20 }).catch(() => []),
    getProps().catch(() => []),
    getEdges({ sport: "NFL", limit: 5 }).catch(() => []),
    getPredictionMarkets({ provider: "kalshi", sport: "NFL", limit: 6 }).catch(() => []),
    getTrackerSummary().catch((): TrackerSummary => EMPTY_SUMMARY),
    getTrackedBets().catch((): TrackedBet[] => []),
  ]);

  const nflProps = props.filter((prop) => prop.sport.toUpperCase() === "NFL");
  const liveGameCount = games.filter((game) => game.status === "live").length;

  return (
    <main className="min-h-dvh overflow-hidden bg-canvas">
      <nav className="relative z-30 border-b border-white/10 bg-[#020512]/90 backdrop-blur-xl" aria-label="Public navigation">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 lg:px-10">
          <RunnerLogo />
          <div className="hidden items-center gap-7 lg:flex">
            <Link href="/" className="text-xs font-black uppercase tracking-widest text-text-muted transition hover:text-text">Home</Link>
            <Link href="/pricing" className="text-xs font-black uppercase tracking-widest text-text-muted transition hover:text-text">Pricing</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/sign-in" className="hidden rounded-lg border border-white/15 px-4 py-2 text-xs font-bold text-text sm:block">Sign In</Link>
            <Link href="/sign-up" className="rounded-lg bg-accent px-4 py-2 text-xs font-black text-white shadow-[0_0_30px_rgba(229,18,43,.3)]">GET RUNNER ACCESS →</Link>
          </div>
        </div>
      </nav>
      <RunnerTicker />

      <SundayHeadquartersHero liveGameCount={liveGameCount} />

      <div className="mx-auto max-w-[1500px] space-y-16 px-5 py-14 lg:px-10 lg:py-20">
        <PresentedByRail presentedBy={PRESENTED_BY_SPONSOR} rail={SPONSOR_LOGO_RAIL} />

        <ModuleSection kicker="Featured Matchup" title="GAME OF THE DAY">
          <GameOfTheDay games={games} />
        </ModuleSection>

        <div className="grid gap-10 lg:grid-cols-2">
          <ModuleSection kicker="Player Lab" title="PLAYER PROP SPOTLIGHT">
            <PlayerPropSpotlight props={nflProps} />
          </ModuleSection>
          <ModuleSection kicker="Fast Lean" title="RUNNER QUICK FLIP">
            <RunnerQuickFlip edges={edges} />
          </ModuleSection>
        </div>

        <ModuleSection kicker="Prediction Markets" title="KALSHI MARKET WATCH">
          <KalshiMarketWatch markets={kalshiMarkets} />
        </ModuleSection>

        <ModuleSection kicker="Community" title="VETERAN VENDOR SPOTLIGHT" sponsor>
          <VeteranVendorSpotlight entries={VETERAN_VENDOR_SPOTLIGHT} />
        </ModuleSection>

        <div className="grid gap-10 lg:grid-cols-2">
          <ModuleSection kicker="On Air" title="RUNNER LIVE DESK">
            <RunnerLiveDesk notes={LIVE_DESK_NOTES} />
          </ModuleSection>
          <ModuleSection kicker="Halftime" title="HALFTIME REPORT">
            <HalftimeReport report={HALFTIME_REPORT} />
          </ModuleSection>
        </div>

        <ModuleSection kicker="Track Record" title="FINAL RESULTS / ACCOUNTABILITY">
          <FinalResultsAccountability summary={trackerSummary} recentBets={trackedBets} />
        </ModuleSection>

        <ModuleSection kicker="Sponsor" title="SPONSOR CTA" sponsor>
          <div className="grid gap-4">
            {CTA_SPONSOR_PANELS.map((panel) => (
              <SponsorCtaPanelView key={panel.id} panel={panel} />
            ))}
          </div>
        </ModuleSection>
      </div>

      <footer className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <div className="flex flex-col gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-center sm:justify-between">
          <RunnerLogo />
          <p className="text-xs font-black uppercase tracking-[.2em] text-text-subtle">WE RUN SPORTS &amp; ANALYTICS.</p>
        </div>
        <div className="pt-7">
          <ResponsibleGamblingNotice />
          <p className="mt-4 text-[10px] text-text-subtle">© 2026 Runner Sports &amp; Analytics LLC · Research and analytics only · Not a sportsbook</p>
        </div>
      </footer>
    </main>
  );
}

function ModuleSection({
  kicker,
  title,
  sponsor = false,
  children,
}: {
  kicker: string;
  title: string;
  sponsor?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={`text-[10px] font-black uppercase tracking-[.27em] ${sponsor ? "text-warning" : "text-accent"}`}>{kicker}</p>
          <h2 className="mt-2 text-2xl font-black uppercase leading-none tracking-[-.03em] text-white sm:text-3xl">{title}</h2>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}
