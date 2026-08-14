import DataStatusBadge from "@/components/ui/DataStatusBadge";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-canvas/95 backdrop-blur px-4 py-3 md:px-8">
      <div className="flex items-center gap-2 md:hidden">
        <div className="h-7 w-7 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-mono font-semibold text-xs">
          R
        </div>
        <p className="text-sm font-semibold tracking-wide text-text">RUNNER</p>
      </div>
      <p className="hidden md:block text-xs text-text-subtle tracking-wide">
        DATA <span className="text-text-subtle mx-1">→</span> INTELLIGENCE <span className="text-text-subtle mx-1">→</span> DECISIONS
      </p>
      <DataStatusBadge />
    </header>
  );
}
