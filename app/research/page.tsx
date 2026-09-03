import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";

const sports = ["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "WNBA", "UFC", "Golf"];
const labs = [
  ["Team Lab", "Schedules, standings, form, splits, injuries, and team-level market performance.", "/teams"],
  ["Player Lab", "Rosters, game logs, usage, splits, projection history, and prop performance.", "/players"],
  ["Trend Lab", "ATS, over/under, home-away, rest, travel, and opponent-adjusted trends.", "/analytics"],
  ["Injury Intelligence", "Availability changes organized by team, player, status, and matchup impact.", "/research/injuries"],
  ["Market Research", "Consensus price, opening line, movement, and model-market disagreement.", "/markets"],
  ["Historical Matchups", "Comparable games, head-to-head context, and situation-specific outcomes.", "/games"],
];

export default function ResearchPage() {
  return <div className="space-y-8"><ProductHeading eyebrow="Research Center" title="Know More Than The Number" description="Move from sport to team, player, trend, injury, and matchup intelligence without breaking the research flow." />
    <section className="data-panel overflow-hidden"><div className="border-b border-border p-5"><p className="text-xs font-bold uppercase tracking-widest text-text-subtle">Choose a sport</p><div className="mt-4 flex flex-wrap gap-2">{sports.map((sport,index)=><Link key={sport} href={`/research/${sport.toLowerCase()}`} className={`rounded-lg border px-4 py-2 text-xs font-black ${index===0 ? "border-accent bg-accent text-white" : "border-border bg-canvas text-text-muted hover:text-text"}`}>{sport}</Link>)}</div></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3">{labs.map(([title,description,href],index)=><Link href={href} key={title} className="group border-b border-r border-border p-6 hover:bg-surface-2"><span className="text-[10px] font-mono text-accent">0{index+1}</span><h2 className="mt-5 text-lg font-bold text-text">{title}</h2><p className="mt-2 text-sm leading-6 text-text-muted">{description}</p><span className="mt-5 inline-block text-xs font-bold text-accent group-hover:translate-x-1">Open lab →</span></Link>)}</div></section>
    <section className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]"><div className="runner-card p-6"><p className="text-[10px] font-bold uppercase tracking-widest text-accent">Runner AI Research</p><h2 className="mt-2 text-xl font-bold text-text">Ask the board a sports question.</h2><div className="mt-5 flex gap-2 rounded-xl border border-border bg-canvas p-2"><input aria-label="Research question" className="min-w-0 flex-1 bg-transparent px-3 text-sm text-text outline-none" placeholder="Which NBA teams outperform after two road losses?"/><button className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-white">Research</button></div></div><div className="runner-card p-6"><p className="text-[10px] font-bold uppercase tracking-widest text-analytics">Data Lineage</p><p className="mt-3 text-sm leading-6 text-text-muted">Every output is labeled as fact, calculation, model output, inference, or unknown—with source and timestamp attached.</p></div></section>
  </div>;
}
