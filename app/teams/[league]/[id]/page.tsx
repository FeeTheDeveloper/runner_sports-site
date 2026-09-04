import { notFound } from "next/navigation";
import Image from "next/image";
import ProductHeading from "@/components/ui/ProductHeading";
import TeamDetailTabs from "@/components/teams/TeamDetailTabs";
import { getTeamRegistry } from "@/lib/data/teamRegistry";
import { getEspnRecords } from "@/lib/data/espn";

export const dynamic = "force-dynamic";

export default async function TeamPage({ params }: { params: Promise<{ league: string; id: string }> }) {
  const { league, id } = await params;
  const decoded = decodeURIComponent(id);
  const teams = await getTeamRegistry(league).catch(() => []);
  const team = teams.find((item) => item.id === decoded);
  if (!team) notFound();
  const records = await getEspnRecords({ league, entityId: team.espnId }).catch(() => []);

  return (
    <div className="space-y-7">
      <div className="flex items-center gap-4">
        {team.logoUrl ? (
          <Image src={team.logoUrl} alt={`${team.name} logo`} width={56} height={56} className="h-14 w-14 shrink-0 rounded-xl bg-surface object-contain" />
        ) : (
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-border bg-surface text-sm font-black text-text-muted">{team.abbreviation}</span>
        )}
        <div className="min-w-0 flex-1">
          <ProductHeading eyebrow={`${league} Team Lab`} title={team.name} description={`${team.abbreviation} · Canonical Runner identity connecting ESPN and sportsbook provider records.`} />
        </div>
      </div>
      <TeamDetailTabs espnId={team.espnId ?? ""} providerRecordCount={records.length} aliasCount={team.aliases.length} records={records} />
    </div>
  );
}
