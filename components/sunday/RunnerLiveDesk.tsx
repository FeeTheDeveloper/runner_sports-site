import type { LiveDeskNote } from "@/lib/sunday/types";
import EmptyState from "@/components/ui/EmptyState";

const TAG_LABEL: Record<NonNullable<LiveDeskNote["tag"]>, string> = {
  injury: "Injury",
  "line-move": "Line move",
  weather: "Weather",
  observation: "Observation",
  admin: "Desk note",
};

export default function RunnerLiveDesk({ notes }: { notes: LiveDeskNote[] }) {
  if (notes.length === 0) {
    return (
      <EmptyState
        title="Live desk is not on air yet"
        description="Notes post here once the desk goes live at kickoff. Append entries to lib/sunday/content.ts (LIVE_DESK_NOTES) during the broadcast."
      />
    );
  }

  const ordered = [...notes].sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));

  return (
    <ul className="data-panel divide-y divide-border">
      {ordered.map((note) => (
        <li key={note.id} className="flex gap-4 p-4">
          <div className="w-16 shrink-0 text-[10px] font-mono text-text-subtle">
            {new Date(note.postedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" })}
          </div>
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-black uppercase tracking-wider text-text">{note.author}</span>
              {note.tag && (
                <span className="rounded-full border border-analytics/30 bg-analytics/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-analytics">
                  {TAG_LABEL[note.tag]}
                </span>
              )}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-muted">{note.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
