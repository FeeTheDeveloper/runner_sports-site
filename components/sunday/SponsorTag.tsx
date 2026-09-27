// Visual/operational separator: any card wrapped with SponsorTag reads as
// paid placement, never as a Runner analytical conclusion. Runner modules use
// the existing accent-red brand language (Badge, ConfidenceBadge, etc.);
// sponsor modules use this amber "SPONSORED" treatment instead, and a
// placeholder sponsor gets an unmistakable second tag on top of that.

export function SponsoredLabel({ placeholder = false }: { placeholder?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-warning">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" aria-hidden="true" />
        Sponsored
      </span>
      {placeholder && (
        <span className="inline-flex items-center rounded-full border border-dashed border-text-subtle/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-text-subtle">
          Placeholder — sponsor TBD
        </span>
      )}
    </div>
  );
}

export default function SponsorPanel({
  placeholder = false,
  className = "",
  children,
}: {
  placeholder?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border border-warning/20 bg-[linear-gradient(145deg,rgba(245,184,67,.07),rgba(14,23,48,.9))] p-5 sm:p-6 ${className}`}
    >
      <SponsoredLabel placeholder={placeholder} />
      <div className="mt-4">{children}</div>
    </section>
  );
}
