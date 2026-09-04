import Link from "next/link";
import ProductHeading from "@/components/ui/ProductHeading";
import { getTeamRegistry } from "@/lib/data/teamRegistry";

export const dynamic = "force-dynamic";

const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "NCAAF", "NCAAB", "WNBA"];

export default async function TeamsPage() { const teams = (await Promise.all(LEAGUES.map(league => getTeamRegistry(league).catch(()=>[])))).flat(); const grouped = teams.reduce<Record<string, typeof teams>>((result, team) => { const letter = team.name.charAt(0).toUpperCase(); (result[letter] ??= []).push(team); return result; }, {}); return <div className="space-y-7"><ProductHeading eyebrow="Team Lab" title="Team Intelligence" description="Canonical team identities connect ESPN facts, sportsbook names, schedules, rosters, injuries, standings, and Runner model history."/>
  <div className="flex flex-wrap gap-1">{"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter=><a href={`#${letter}`} key={letter} className="grid h-8 w-8 place-items-center rounded border border-border bg-surface text-[10px] font-bold text-text-muted hover:border-accent hover:text-text">{letter}</a>)}</div>
  {teams.length ? <div className="space-y-6">{Object.entries(grouped).map(([letter,items])=><section id={letter} key={letter}><p className="mb-2 text-xs font-black text-accent">{letter}</p><div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 xl:grid-cols-3">{items?.map(team=><Link href={`/teams/${team.league}/${team.id}`} key={team.id} className="flex items-center gap-3 bg-surface p-4 hover:bg-surface-2"><TeamFace name={team.name} abbreviation={team.abbreviation} logoUrl={team.logoUrl}/><div className="min-w-0 flex-1"><p className="truncate font-bold text-text">{team.name}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-text-subtle">{team.league} · {team.abbreviation}</p></div><span className="text-accent">→</span></Link>)}</div></section>)}</div> : <div className="data-panel p-10 text-center"><p className="font-bold text-text">Team registry awaits ESPN sync.</p><p className="mt-2 text-sm text-text-muted">Canonical team profiles will appear automatically after ingestion.</p></div>}
  </div>; }

function TeamFace({ name, abbreviation, logoUrl }: { name: string; abbreviation: string; logoUrl?: string }) {
  if (logoUrl) return <img src={logoUrl} alt={`${name} logo`} className="h-10 w-10 shrink-0 rounded-lg bg-canvas object-contain" loading="lazy" />;
  return <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-canvas text-[10px] font-black text-text-muted">{abbreviation}</span>;
}
