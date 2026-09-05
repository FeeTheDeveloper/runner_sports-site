import Image from "next/image";

const SIZE_STYLES = {
  sm: { box: "h-8 w-8 rounded-lg", pixels: 32 },
  md: { box: "h-12 w-12 rounded-xl", pixels: 48 },
  lg: { box: "h-16 w-16 rounded-2xl", pixels: 64 },
} as const;

export default function TeamLogo({
  name,
  abbreviation,
  logoUrl,
  size = "md",
}: {
  name: string;
  abbreviation: string;
  logoUrl?: string;
  size?: keyof typeof SIZE_STYLES;
}) {
  const style = SIZE_STYLES[size];
  return (
    <span className={`relative grid shrink-0 place-items-center overflow-hidden border border-border-strong bg-canvas ${style.box}`}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          sizes={`${style.pixels}px`}
          className="object-contain p-1"
        />
      ) : (
        <span className="text-[10px] font-black text-text-muted" aria-label={`${name} logo unavailable`}>
          {abbreviation}
        </span>
      )}
    </span>
  );
}
