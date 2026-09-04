import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import { getEspnRecords } from "@/lib/data/espn";

export const dynamic = "force-dynamic";

export default async function SportResearchPage({ params }: { params: Promise<{ sport: string }> }) {
  const { sport } = await params;
  const records = await getEspnRecords({ sport }).catch(() => []);
  const label = sport.toUpperCase();
  const counts = records.reduce<Record<string, number>>((map, record) => { const items = Array.isArray(record.payload) ? record.payload.length : record.payload ? 1 : 0; map[record.dataType] = (map[record.dataType] ?? 0) + items; return map; }, {});
  const latest = records[0];
  return <div className="space-y-7"><ProductHeading eyebrow="Research Center" title={`${label} Intelligence`} description={`ESPN facts and Runner market intelligence organized for ${label} research.`}/>{latest && <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-xs text-text-muted"><span className="font-bold text-analytics">Source: {latest.provider}</span><span>Last retrieved {new Date(latest.retrievedAt).toLocaleString()}</span></div>}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{["scoreboard","standings","injuries","roster"].map(type=><div key={type} className="runner-card p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">{type}</p><p className="metric-number mt-3 text-3xl font-black text-text">{counts[type] ?? 0}</p><p className="mt-1 text-xs text-text-muted">items available</p></div>)}</div><div className="grid gap-3 md:grid-cols-3"><ResearchLink href="/games" title="Matchups"/><ResearchLink href="/teams" title="Teams"/><ResearchLink href="/markets" title="Market Trends"/></div></div>;
}
function ResearchLink({href,title}:{href:string;title:string}){return <Link href={href} className="data-panel flex items-center justify-between p-5 font-bold text-text">{title}<span className="text-accent">→</span></Link>}
