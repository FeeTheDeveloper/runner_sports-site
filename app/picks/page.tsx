import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import FilterBar from "@/components/ui/FilterBar";
import { getEdges } from "@/lib/data/edges";
import { getProps } from "@/lib/data/props";
import { formatOdds, formatPercent, formatSignedPercent } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

const SPORTS = ["MLB", "NFL", "NBA", "NHL"];

export default async function PicksPage({ searchParams }: { searchParams: Promise<{ sport?: string; market?: string }> }) {
  const params = await searchParams;
  const [allEdges, props] = await Promise.all([getEdges({ sport: params.sport, limit: 50 }).catch(() => []), getProps().catch(() => [])]);
  const edges = params.market ? allEdges.filter((edge) => edge.market.toLowerCase() === params.market) : allEdges;
  const recommendations = edges.slice(0, 8);
  return (
    <div className="space-y-7">
      <ProductHeading eyebrow="Runner Command" title="Picks For You" description="The strongest model-versus-market disagreements on today’s board, ranked by edge, confidence, and data quality." actions={<><Link href="/models" className="rounded-lg border border-border px-4 py-2 text-xs font-bold text-text-muted">Manage Models</Link><Link href="/tracker" className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white">Open Tracker</Link></>} />
      <FilterBar sports={SPORTS} markets={["Moneyline"]} showDate={false} showSearch={false} />
      {recommendations.length ? <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{recommendations.map((edge, index) => (
        <article key={edge.id} className="data-panel signal-glow overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3"><span className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">#{index + 1} Runner Pick</span><span className="rounded-full bg-positive/10 px-2 py-1 text-[10px] font-bold text-positive">{edge.confidence} confidence</span></div>
          <div className="p-5"><p className="text-xs font-semibold uppercase tracking-wide text-analytics">{edge.event} · {edge.market}</p><h2 className="mt-2 text-xl font-black text-text">{edge.selection}</h2><p className="mt-1 font-mono text-sm text-text-muted">{edge.odds === undefined ? "Best line" : formatOdds(edge.odds)}</p>
          <div className="mt-5 grid grid-cols-3 gap-2"><Metric label="Runner" value={formatPercent(edge.modelProbability)} accent /><Metric label="Market" value={formatPercent(edge.impliedProbability)} /><Metric label="Edge" value={formatSignedPercent(edge.edge)} positive /></div>
          <Link href="/edge" className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-bold text-text">Why Runner likes it <span className="text-accent">Analyze →</span></Link></div>
        </article>
      ))}</div> : <EmptyBoard />}
      <section><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-accent">Player Lab</p><h2 className="mt-1 text-xl font-bold text-text">Trending Player Props</h2></div><Link href="/props" className="text-xs font-semibold text-accent">View all →</Link></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{props.slice(0,4).map(prop => <div key={prop.id} className="runner-card p-4"><p className="text-xs text-text-subtle">{prop.player.name} · {prop.market}</p><p className="mt-2 font-bold text-text">OVER {prop.line}</p><p className="mt-3 text-xs text-text-muted">Runner probability <span className="font-mono text-text">{formatPercent(prop.probability)}</span></p></div>)}</div></section>
    </div>
  );
}

function Metric({ label, value, accent, positive }: { label: string; value: string; accent?: boolean; positive?: boolean }) { return <div className="rounded-lg border border-border bg-canvas/70 p-3"><p className="text-[9px] uppercase tracking-wider text-text-subtle">{label}</p><p className={`metric-number mt-1 text-lg font-black ${accent ? "text-accent" : positive ? "text-positive" : "text-text"}`}>{value}</p></div>; }
function EmptyBoard() { return <div className="data-panel p-10 text-center"><p className="text-lg font-bold text-text">Runner board is waiting on today’s market sync.</p><p className="mt-2 text-sm text-text-muted">The product shell is live. Picks populate automatically when the odds pipeline has qualifying edges.</p><Link href="/odds" className="mt-5 inline-block rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white">Open Odds Board</Link></div>; }
