export default function DataStatusBadge({ label = "Mock Data — Live feed not connected" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[11px] font-medium text-warning">
      <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
      {label}
    </span>
  );
}
