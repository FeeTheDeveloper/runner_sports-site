import { formatPercent } from "@/lib/utils/format";

interface ProbabilityBarProps {
  label: string;
  value: number;
  compareValue?: number;
  compareLabel?: string;
}

export default function ProbabilityBar({ label, value, compareValue, compareLabel }: ProbabilityBarProps) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const comparePct = compareValue !== undefined ? Math.max(0, Math.min(1, compareValue)) * 100 : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-text-muted">{label}</span>
        <span className="font-mono text-text">{formatPercent(value)}</span>
      </div>
      <div className="relative h-1.5 rounded-full bg-surface-3 overflow-hidden">
        <div className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${pct}%` }} />
        {comparePct !== undefined && (
          <div
            className="absolute inset-y-[-2px] w-px bg-text-subtle"
            style={{ left: `${comparePct}%` }}
            title={compareLabel ?? "Market implied probability"}
          />
        )}
      </div>
    </div>
  );
}
