import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import FilterBar from "@/components/ui/FilterBar";
import { getGames } from "@/lib/data/games";
import { formatOdds } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const SPORTS = ["MLB", "NFL", "NCAAF", "NBA", "NHL"];

export default async function OddsPage({ searchParams }: { searchParams: Promise<{ sport?: string; window?: string; q?: string }> }) {
  const params = await searchParams;
  const now = new Date();
  const window = params.window ?? "7d";
  const startsBefore = window === "today" ? new Date(now.getTime() + 86400000).toISOString() : window === "7d" ? new Date(now.getTime() + 7 * 86400000).toISOString() : undefined;
  const games = await getGames({ sport: params.sport, query: params.q, startsAfter: now.toISOString(), startsBefore, limit: 100 }).catch(() => []);
  return <div className="space-y-7"><ProductHeading eyebrow="Market Lab" title="Live Odds" description="Compare moneylines, spreads, and totals across the active slate. Best prices are highlighted automatically." />
    <FilterBar sports={SPORTS} />
    <div className="overflow-hidden rounded-xl border border-border bg-surface"><div className="grid min-w-[760px] grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(130px,.6fr))_90px] border-b border-border bg-surface-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-text-subtle"><span>Matchup</span><span className="text-center">Moneyline</span><span className="text-center">Spread</span><span className="text-center">Total</span><span></span></div>
    <div className="overflow-x-auto">{games.length ? games.map(game => <div key={game.id} className="grid min-w-[760px] grid-cols-[minmax(260px,1.4fr)_repeat(3,minmax(130px,.6fr))_90px] items-center border-b border-border px-5 py-4 last:border-0"><div><p className="text-sm font-bold text-text">{game.awayTeam.abbreviation} <span className="text-text-subtle">@</span> {game.homeTeam.abbreviation}</p><p className="mt-1 text-xs text-text-subtle">{game.league} · {new Date(game.startsAt).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit", timeZone:"America/Chicago" })} CT</p></div><OddsPair a={game.moneyline.away} b={game.moneyline.home}/><OddsPair a={game.spread.away} b={game.spread.home} prefix={`${game.spread.line > 0 ? "+" : ""}${game.spread.line} `}/><OddsPair a={game.total.over} b={game.total.under} prefix={`O/U ${game.total.line} `}/><Link href={`/games/${game.id}`} className="text-right text-xs font-bold text-accent">Matchup →</Link></div>) : <div className="p-12 text-center"><p className="font-bold text-text">No current lines loaded.</p><p className="mt-2 text-sm text-text-muted">The board will populate on the next successful sportsbook sync.</p></div>}</div></div>
    <div className="grid gap-3 md:grid-cols-3"><Info title="Best Line Engine" text="Surfaces the strongest available price across connected books."/><Info title="No-Vig Consensus" text="Removes bookmaker margin before comparing probabilities."/><Info title="Movement Monitor" text="Stores snapshots to expose meaningful market changes."/></div>
  </div>;
}
function OddsPair({a,b,prefix=""}:{a:number;b:number;prefix?:string}) { return <div className="space-y-1 text-center font-mono text-xs"><p className="rounded bg-canvas px-2 py-1.5 text-text">{prefix}{a === 0 ? "—" : formatOdds(a)}</p><p className="rounded bg-canvas px-2 py-1.5 text-text">{prefix}{b === 0 ? "—" : formatOdds(b)}</p></div>; }
function Info({title,text}:{title:string;text:string}) { return <div className="runner-card p-4"><p className="text-xs font-bold uppercase tracking-wider text-accent">{title}</p><p className="mt-2 text-sm text-text-muted">{text}</p></div>; }
