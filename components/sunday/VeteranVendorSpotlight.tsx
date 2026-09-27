import type { VeteranVendorSpotlightEntry } from "@/lib/sunday/types";
import SponsorPanel from "@/components/sunday/SponsorTag";
import EmptyState from "@/components/ui/EmptyState";

export default function VeteranVendorSpotlight({ entries }: { entries: VeteranVendorSpotlightEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        title="Veteran vendor spotlight is open"
        description="No vendor is booked into this slot yet. Add one to lib/sunday/content.ts."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {entries.map((entry) => (
        <SponsorPanel key={entry.id} placeholder={entry.placeholder}>
          <p className="text-lg font-black uppercase tracking-tight text-text">{entry.vendorName}</p>
          {(entry.ownerName || entry.branchOfService) && (
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-text-subtle">
              {[entry.ownerName, entry.branchOfService].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-3 text-sm leading-6 text-text-muted">{entry.description}</p>
          {entry.href && (
            <a
              href={entry.href}
              className="mt-4 inline-flex text-xs font-black uppercase tracking-wider text-warning underline decoration-warning/50 underline-offset-4"
            >
              Visit vendor →
            </a>
          )}
        </SponsorPanel>
      ))}
    </div>
  );
}
