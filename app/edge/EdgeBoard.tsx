"use client";

import { useMemo, useState } from "react";
import type { RunnerEdge } from "@/types";
import SportsTable from "@/components/ui/SportsTable";
import EdgeCard from "@/components/sports/EdgeCard";
import ConfidenceBadge from "@/components/ui/ConfidenceBadge";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { formatOdds, formatPercent, formatSignedPercent, formatDateTime } from "@/lib/utils/format";

const ALL = "all";

const riskVariant = {
  low: "success",
  moderate: "warning",
  high: "danger",
} as const;

export default function EdgeBoard({ edges }: { edges: RunnerEdge[] }) {
  const [sport, setSport] = useState(ALL);
  const sports = useMemo(() => Array.from(new Set(edges.map((e) => e.sport))), [edges]);
  const filtered = sport === ALL ? edges : edges.filter((e) => e.sport === sport);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSport(ALL)}
          className={`rounded-full border px-3 py-1 text-xs ${
            sport === ALL ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text"
          }`}
        >
          All Sports
        </button>
        {sports.map((s) => (
          <button
            key={s}
            onClick={() => setSport(s)}
            className={`rounded-full border px-3 py-1 text-xs ${
              sport === s ? "border-accent/40 bg-accent/10 text-accent" : "border-border text-text-muted hover:text-text"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No edges for this sport" />
      ) : (
        <>
          <div className="hidden md:block">
            <SportsTable
              rowKey={(e) => e.id}
              rows={filtered}
              columns={[
                { key: "rank", header: "#", render: (e) => <span className="font-mono text-text-subtle">{e.rank}</span> },
                { key: "sport", header: "Sport", render: (e) => <Badge variant="accent" label={e.sport} /> },
                {
                  key: "event",
                  header: "Event / Selection",
                  render: (e) => (
                    <div>
                      <p className="text-text">{e.selection}</p>
                      <p className="text-xs text-text-subtle">
                        {e.event} · {e.market}
                      </p>
                    </div>
                  ),
                },
                { key: "sportsbook", header: "Book", render: (e) => <span className="text-text-muted">{e.sportsbook ?? "—"}</span> },
                { key: "line", header: "Line", align: "right", render: (e) => <span className="font-mono">{e.line ?? "—"}</span> },
                { key: "odds", header: "Odds", align: "right", render: (e) => <span className="font-mono">{e.odds !== undefined ? formatOdds(e.odds) : "—"}</span> },
                { key: "implied", header: "Implied", align: "right", render: (e) => <span className="font-mono">{formatPercent(e.impliedProbability)}</span> },
                { key: "model", header: "Runner", align: "right", render: (e) => <span className="font-mono text-accent">{formatPercent(e.modelProbability)}</span> },
                { key: "edge", header: "Edge", align: "right", render: (e) => <span className="font-mono text-positive">{formatSignedPercent(e.edge)}</span> },
                { key: "confidence", header: "Confidence", render: (e) => <ConfidenceBadge confidence={e.confidence} compact /> },
                { key: "risk", header: "Risk", render: (e) => <Badge variant={riskVariant[e.riskLevel]} label={e.riskLevel} /> },
                { key: "updated", header: "Updated", align: "right", render: (e) => <span className="text-xs text-text-subtle">{formatDateTime(e.updatedAt)}</span> },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:hidden">
            {filtered.map((edge) => (
              <EdgeCard key={edge.id} edge={edge} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
