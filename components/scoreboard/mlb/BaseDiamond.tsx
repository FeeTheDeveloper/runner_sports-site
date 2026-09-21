import type { MlbSituation } from "@/types";

const BASE_CLASS = "h-5 w-5 rotate-45 border-2 border-border-strong bg-canvas";
const ACTIVE_CLASS = "border-accent bg-accent shadow-[0_0_14px_rgba(229,18,43,.75)]";

export default function BaseDiamond({ bases }: { bases: MlbSituation["bases"] }) {
  return (
    <div className="relative h-16 w-24">
      <div className={`absolute left-1/2 top-0 -translate-x-1/2 ${BASE_CLASS} ${bases.second ? ACTIVE_CLASS : ""}`} />
      <div className={`absolute left-3 top-7 ${BASE_CLASS} ${bases.third ? ACTIVE_CLASS : ""}`} />
      <div className={`absolute right-3 top-7 ${BASE_CLASS} ${bases.first ? ACTIVE_CLASS : ""}`} />
    </div>
  );
}
