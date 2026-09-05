"use client";

import { useMemo, useState } from "react";
import type { Confidence, PlayerProp } from "@/types";
import PropCard from "@/components/sports/PropCard";
import EmptyState from "@/components/ui/EmptyState";

const ALL = "all";

export default function PropsExplorer({ props }: { props: PlayerProp[] }) {
  const [sport, setSport] = useState(ALL);
  const [market, setMarket] = useState(ALL);
  const [confidence, setConfidence] = useState<typeof ALL | Confidence>(ALL);
  const [team, setTeam] = useState(ALL);

  const sports = useMemo(() => Array.from(new Set(props.map((p) => p.sport))), [props]);
  const markets = useMemo(() => Array.from(new Set(props.map((p) => p.market))), [props]);
  const teams = useMemo(() => Array.from(new Set(props.map((p) => p.player.team).filter(Boolean))), [props]);

  const filtered = props.filter((p) => {
    if (sport !== ALL && p.sport !== sport) return false;
    if (market !== ALL && p.market !== market) return false;
    if (confidence !== ALL && p.confidence !== confidence) return false;
    if (team !== ALL && p.player.team !== team) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <FilterSelect label="Sport" value={sport} onChange={setSport} options={sports} />
        <FilterSelect label="Market" value={market} onChange={setMarket} options={markets} />
        <FilterSelect label="Team" value={team} onChange={setTeam} options={teams} />
        <FilterSelect
          label="Confidence"
          value={confidence}
          onChange={(v) => setConfidence(v as typeof ALL | Confidence)}
          options={["high", "moderate", "low"]}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((prop) => (
            <PropCard key={prop.id} prop={prop} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={props.length === 0 ? "No player props available yet" : "No props match these filters"}
          description={
            props.length === 0
              ? "The next odds sync will load available player markets for nearby games."
              : "Try clearing one or more filters above."
          }
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-text-muted">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text focus:border-accent focus:outline-none"
      >
        <option value={ALL}>All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}
