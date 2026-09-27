import Image from "next/image";
import type { Sponsor } from "@/lib/sunday/types";

// Mirrors components/sports/TeamLogo's "no artwork → text monogram" fallback
// so a sponsor without a supplied logo never gets a fabricated image.
export default function SponsorMark({ sponsor, size = "md" }: { sponsor: Sponsor; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 rounded-2xl" : size === "sm" ? "h-9 w-9 rounded-lg" : "h-12 w-12 rounded-xl";
  const pixels = size === "lg" ? 64 : size === "sm" ? 36 : 48;
  const initials = sponsor.name
    .replace(/sponsor slot\s*/i, "")
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden border border-dashed border-warning/40 bg-canvas ${box}`}>
      {sponsor.logoUrl ? (
        <Image src={sponsor.logoUrl} alt={`${sponsor.name} logo`} fill sizes={`${pixels}px`} className="object-contain p-1.5" />
      ) : (
        <span className="text-[10px] font-black text-warning" aria-label={`${sponsor.name} logo not yet supplied`}>
          {initials}
        </span>
      )}
    </span>
  );
}
