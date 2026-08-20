const TONE_CLASSES = {
  warning: "border-warning/30 bg-warning/10 text-warning [&_span]:bg-warning",
  live: "border-positive/30 bg-positive/10 text-positive [&_span]:bg-positive",
} as const;

export default function DataStatusBadge({
  label = "Live Feed — The Odds API via Supabase",
  tone = "live",
}: {
  label?: string;
  tone?: keyof typeof TONE_CLASSES;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${TONE_CLASSES[tone]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" aria-hidden="true" />
      {label}
    </span>
  );
}
