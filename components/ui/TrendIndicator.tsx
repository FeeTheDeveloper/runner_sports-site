import type { TrendDirection } from "@/types";

const glyph: Record<TrendDirection, string> = {
  up: "▲",
  down: "▼",
  flat: "▬",
};

const color: Record<TrendDirection, string> = {
  up: "text-positive",
  down: "text-negative",
  flat: "text-text-subtle",
};

export default function TrendIndicator({ direction, children }: { direction: TrendDirection; children?: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-xs ${color[direction]}`}>
      <span aria-hidden="true">{glyph[direction]}</span>
      {children}
    </span>
  );
}
