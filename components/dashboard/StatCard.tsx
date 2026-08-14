import type { TrendDirection } from "@/types";
import TrendIndicator from "@/components/ui/TrendIndicator";

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  trend?: { direction: TrendDirection; label: string };
}

export default function StatCard({ label, value, hint, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-[11px] uppercase tracking-wide text-text-subtle">{label}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-text">{value}</p>
      <div className="mt-1 flex items-center justify-between">
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
        {trend && <TrendIndicator direction={trend.direction}>{trend.label}</TrendIndicator>}
      </div>
    </div>
  );
}
