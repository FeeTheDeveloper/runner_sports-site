import Image from "next/image";

const SIZE_STYLES = {
  sm: { box: "h-9 w-9", pixels: 36 },
  md: { box: "h-11 w-11", pixels: 44 },
  lg: { box: "h-16 w-16", pixels: 64 },
} as const;

export default function PlayerHeadshot({
  name,
  headshotUrl,
  size = "md",
}: {
  name: string;
  headshotUrl?: string;
  size?: keyof typeof SIZE_STYLES;
}) {
  const style = SIZE_STYLES[size];
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-surface-2 text-xs font-bold text-accent ${style.box}`}>
      {headshotUrl ? (
        <Image src={headshotUrl} alt={`${name} headshot`} fill sizes={`${style.pixels}px`} className="object-cover" />
      ) : (
        <span aria-label={`${name} headshot unavailable`}>{initials}</span>
      )}
    </span>
  );
}
