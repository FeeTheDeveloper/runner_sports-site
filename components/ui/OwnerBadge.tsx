import { OWNER_BADGE } from "@/lib/auth/owner";

/**
 * The exclusive owner badge. Only the single configured owner account renders
 * it, so it is deliberately unlike the accent Badge used for routine labels:
 * gold rather than brand red, with a crest mark and a sheen edge.
 */
export default function OwnerBadge({ compact = false, className = "" }: { compact?: boolean; className?: string }) {
  return (
    <span
      title={OWNER_BADGE.description}
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-warning/45 bg-gradient-to-r from-warning/20 via-warning/10 to-transparent ${compact ? "px-2.5 py-1" : "px-3.5 py-1.5"} ${className}`}
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-warning/70 to-transparent" />
      <svg aria-hidden viewBox="0 0 24 24" className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2 4 5.5v6c0 4.7 3.2 8.9 8 10.5 4.8-1.6 8-5.8 8-10.5v-6L12 2Z" className="text-warning" />
        <path d="m9 11.5 2.2 2.2L15.5 9.4" />
      </svg>
      <span className={`font-black uppercase tracking-[0.16em] text-warning ${compact ? "text-[10px]" : "text-[11px]"}`}>
        {compact ? OWNER_BADGE.label : OWNER_BADGE.title}
      </span>
    </span>
  );
}
