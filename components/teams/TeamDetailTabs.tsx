"use client";

import { useState } from "react";
import type { EspnInjuryEntry, EspnRecordRow, EspnRosterAthlete } from "@/types";

const TABS = ["Overview", "Schedule", "Roster", "Injuries", "Stats", "Trends", "ATS", "O/U", "Odds", "News", "Models"] as const;
type Tab = (typeof TABS)[number];

const CONNECTED: Partial<Record<Tab, string>> = { Roster: "roster", Injuries: "injuries" };

export default function TeamDetailTabs({
  espnId,
  providerRecordCount,
  aliasCount,
  records,
}: {
  espnId: string;
  providerRecordCount: number;
  aliasCount: number;
  records: EspnRecordRow[];
}) {
  const [active, setActive] = useState<Tab>("Overview");
  const roster = records.find((r) => r.dataType === "roster")?.payload as EspnRosterAthlete[] | undefined;
  const injuries = records.find((r) => r.dataType === "injuries")?.payload as EspnInjuryEntry[] | undefined;

  return (
    <div>
      <nav className="flex flex-wrap gap-2" role="tablist" aria-label="Team intelligence sections">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={active === tab}
            onClick={() => setActive(tab)}
            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${active === tab ? "border-accent bg-accent text-white" : "border-border bg-surface text-text-muted hover:border-border-strong hover:text-text"}`}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card label="ESPN ID" value={espnId || "Pending"} />
        <Card label="Provider Records" value={String(providerRecordCount)} />
        <Card label="Aliases" value={String(aliasCount)} />
      </div>

      <div className="mt-4 data-panel p-6">
        {active === "Overview" && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Team Intelligence Feed</p>
            <p className="mt-3 text-sm text-text-muted">Schedules, roster facts, injuries, standings, news, and model results will assemble here as their individual provider records arrive.</p>
          </>
        )}
        {active === "Roster" && (
          roster && roster.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {roster.map((athlete) => (
                <div key={athlete.espnId} className="rounded-lg border border-border bg-canvas p-3">
                  <p className="font-bold text-text">{athlete.name}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-text-subtle">{[athlete.position, athlete.jersey && `#${athlete.jersey}`].filter(Boolean).join(" · ") || "—"}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTab label="Roster" />
          )
        )}
        {active === "Injuries" && (
          injuries && injuries.length > 0 ? (
            <div className="space-y-2">
              {injuries.map((entry) => (
                <div key={`${entry.athleteId ?? entry.athleteName}`} className="flex items-center justify-between rounded-lg border border-border bg-canvas p-3">
                  <div><p className="font-bold text-text">{entry.athleteName}</p><p className="mt-1 text-[10px] uppercase tracking-widest text-text-subtle">{entry.position ?? "—"}</p></div>
                  <span className="rounded-full bg-warning/10 px-2 py-1 text-[10px] font-bold text-warning">{entry.status ?? "Unknown"}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyTab label="Injuries" />
          )
        )}
        {active !== "Overview" && !CONNECTED[active] && <EmptyTab label={active} />}
      </div>
    </div>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <>
      <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{label}</p>
      <p className="mt-3 text-sm text-text-muted">No {label.toLowerCase()} data has synced for this team yet. This surface will populate automatically once ESPN ingestion covers it.</p>
    </>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="runner-card p-5">
      <p className="text-[10px] uppercase tracking-widest text-text-subtle">{label}</p>
      <p className="mt-3 text-xl font-black text-text">{value}</p>
    </div>
  );
}
