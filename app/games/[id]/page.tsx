import Link from "next/link";
import { notFound } from "next/navigation";
import ProductHeading from "@/components/ui/ProductHeading";
import ProbabilityBar from "@/components/ui/ProbabilityBar";
import { getGameById } from "@/lib/data/games";
import { getPropsByGame } from "@/lib/data/props";
import { formatOdds, formatPercent } from "@/lib/utils/format";

export const dynamic = "force-dynamic";

export default async function MatchupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [game, props] = await Promise.all([getGameById(id).catch(() => undefined), getPropsByGame(id).catch(() => [])]);
  if (!game) notFound();
  const projected = game.runnerProjectedWinner === game.homeTeam.id ? game.homeTeam : game.awayTeam;
  return <div className="space-y-7"><ProductHeading eyebrow={`${game.league} Matchup Center`} title={`${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`} description={`${new Date(game.startsAt).toLocaleString("en-US", { dateStyle:"full", timeStyle:"short", timeZone:"America/Chicago" })} CT · Full game, market, player, trend, model, injury, and news intelligence.`}/>
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-2">{["Game","Odds","Props","Players","Trends","Models","Injuries","News","Line Movement"].map((tab,i)=><button key={tab} className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${i===0?"bg-accent text-white":"text-text-muted hover:bg-surface-2 hover:text-text"}`}>{tab}</button>)}</nav>
    <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div className="data-panel p-6"><div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-center"><Team name={game.awayTeam.name} abbr={game.awayTeam.abbreviation} odds={game.moneyline.away}/><div><p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">{game.status}</p><p className="mt-2 text-sm font-black text-text">VS</p></div><Team name={game.homeTeam.name} abbr={game.homeTeam.abbreviation} odds={game.moneyline.home}/></div><div className="mt-7"><ProbabilityBar label={`Runner projects ${projected.abbreviation}`} value={game.modelProbability}/></div></div>
      <div className="data-panel p-6"><p className="text-[10px] font-bold uppercase tracking-widest text-accent">Model Comparison</p><div className="mt-5 space-y-4"><Compare label="RSA probability" value={formatPercent(game.modelProbability)} accent/><Compare label="Market implied" value={formatPercent(game.modelProbability)}/><Compare label="ESPN predictor" value="Awaiting event data"/></div></div></section>
    <section className="grid gap-4 md:grid-cols-3"><Market label="Moneyline" a={formatOdds(game.moneyline.away)} b={formatOdds(game.moneyline.home)}/><Market label={`Spread ${game.spread.line}`} a={formatOdds(game.spread.away)} b={formatOdds(game.spread.home)}/><Market label={`Total ${game.total.line}`} a={formatOdds(game.total.over)} b={formatOdds(game.total.under)}/></section>
    <section className="runner-card p-6"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-accent">Player Lab</p><h2 className="mt-1 text-xl font-bold text-text">Available Props</h2></div><Link href={`/props?gameId=${game.id}`} className="text-xs font-bold text-accent">Open prop board →</Link></div><p className="mt-5 text-sm text-text-muted">{props.length ? `${props.length} player markets available for this matchup.` : "Player markets will populate when provider coverage becomes available."}</p></section>
  </div>;
}
function Team({name,abbr,odds}:{name:string;abbr:string;odds:number}){return <div><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-border-strong bg-canvas text-xl font-black text-text">{abbr}</div><p className="mt-3 text-sm font-bold text-text">{name}</p><p className="mt-1 font-mono text-sm text-accent">{odds===0?"—":formatOdds(odds)}</p></div>}
function Compare({label,value,accent}:{label:string;value:string;accent?:boolean}){return <div className="flex items-center justify-between border-b border-border pb-3"><span className="text-sm text-text-muted">{label}</span><span className={`font-mono font-bold ${accent?"text-accent":"text-text"}`}>{value}</span></div>}
function Market({label,a,b}:{label:string;a:string;b:string}){return <div className="runner-card p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-text-subtle">{label}</p><div className="mt-3 flex gap-2"><span className="flex-1 rounded-lg bg-canvas p-3 text-center font-mono text-text">{a}</span><span className="flex-1 rounded-lg bg-canvas p-3 text-center font-mono text-text">{b}</span></div></div>}
