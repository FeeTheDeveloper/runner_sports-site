"use client";

const TABS = ["Game", "Odds", "Props", "Players", "Trends", "Models", "Injuries", "News", "Line Movement"] as const;
export type GameTab = (typeof TABS)[number];

export default function GameDetailTabs({ active, onChange }: { active: GameTab; onChange: (tab: GameTab) => void }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-surface p-2" role="tablist" aria-label="Matchup sections">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold ${active === tab ? "bg-accent text-white" : "text-text-muted hover:bg-surface-2 hover:text-text"}`}
        >
          {tab}
        </button>
      ))}
    </nav>
  );
}
