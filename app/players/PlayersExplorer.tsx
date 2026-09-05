"use client";

import { useMemo, useState } from "react";
import PlayerHeadshot from "@/components/sports/PlayerHeadshot";
import EmptyState from "@/components/ui/EmptyState";
import type { Player } from "@/types";

export default function PlayersExplorer({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return players;
    return players.filter((player) =>
      [player.name, player.team, player.position].some((value) => value?.toLowerCase().includes(term)),
    );
  }, [players, query]);

  return (
    <div className="space-y-6">
      <div className="data-panel p-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="w-full rounded-xl border border-border bg-canvas px-5 py-4 text-sm text-text outline-none focus:border-accent"
          placeholder="Search a player, team, or position…"
          aria-label="Search players"
        />
      </div>
      {visible.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {visible.map((player) => (
            <article key={player.id} className="runner-card flex items-center gap-4 p-4">
              <PlayerHeadshot name={player.name} headshotUrl={player.headshotUrl} size="lg" />
              <div className="min-w-0">
                <h2 className="truncate font-bold text-text">{player.name}</h2>
                <p className="mt-1 text-xs text-text-muted">{player.team || "Team pending"}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-text-subtle">{player.position || "Player prop market"}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          title={players.length === 0 ? "No player identities synced yet" : "No players match that search"}
          description={players.length === 0 ? "Player profiles will appear with the next available prop sync." : "Try a player, team, or position."}
        />
      )}
    </div>
  );
}
