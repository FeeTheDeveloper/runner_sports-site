import type { Sponsor } from "@/lib/sunday/types";
import SponsorPanel from "@/components/sunday/SponsorTag";
import SponsorMark from "@/components/sunday/SponsorMark";

export default function PresentedByRail({
  presentedBy,
  rail,
}: {
  presentedBy: Sponsor;
  rail: Sponsor[];
}) {
  return (
    <SponsorPanel placeholder={presentedBy.placeholder && rail.every((s) => s.placeholder)} className="!p-4 sm:!p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <SponsorMark sponsor={presentedBy} size="md" />
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-text-subtle">Presented by</p>
            <p className="truncate text-sm font-bold text-text">{presentedBy.tagline ?? presentedBy.name}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          {rail.map((sponsor) => (
            <SponsorMark key={sponsor.id} sponsor={sponsor} size="sm" />
          ))}
        </div>
      </div>
    </SponsorPanel>
  );
}
