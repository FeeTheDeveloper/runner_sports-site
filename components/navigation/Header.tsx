import DataStatusBadge from "@/components/ui/DataStatusBadge";
import RunnerLogo from "@/components/brand/RunnerLogo";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-canvas/90 px-4 py-3 backdrop-blur-xl md:px-8 xl:px-10">
      <div className="md:hidden"><RunnerLogo compact /></div>
      <p className="hidden md:block text-xs text-text-subtle tracking-wide">
        DATA <span className="text-text-subtle mx-1">→</span> INTELLIGENCE <span className="text-text-subtle mx-1">→</span> DECISIONS
      </p>
      <div className="flex items-center gap-2">
        <button aria-label="Search Runner" className="hidden min-h-10 rounded-lg border border-border bg-surface px-3 text-xs text-text-muted transition hover:border-border-strong hover:text-text sm:block">Search markets, players, teams <kbd className="ml-4 font-mono text-[10px] text-text-subtle">/</kbd></button>
        <DataStatusBadge />
        <button aria-label="Open profile" className="grid h-10 w-10 place-items-center rounded-full border border-border-strong bg-surface text-xs font-semibold text-accent transition hover:border-accent/40">RS</button>
      </div>
    </header>
  );
}
