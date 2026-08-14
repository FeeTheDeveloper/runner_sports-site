import Link from "next/link";

export default function RunnerLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="Runner Sports and Analytics home">
      <span className="runner-logo-mark h-9 w-9 shrink-0 rounded-lg border border-accent/25 shadow-[0_0_24px_rgba(101,215,231,0.12)]" aria-hidden="true" />
      {!compact && (
        <span className="leading-none">
          <span className="block text-sm font-bold tracking-[0.18em] text-text">RUNNER</span>
          <span className="mt-1 block text-[9px] tracking-[0.16em] text-text-muted">SPORTS &amp; ANALYTICS</span>
        </span>
      )}
    </Link>
  );
}
