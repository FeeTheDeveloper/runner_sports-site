import type { Prop } from "@/types";
import { formatOdds } from "@/lib/utils/format";

interface PropRowProps {
  prop: Prop;
}

export default function PropRow({ prop }: PropRowProps) {
  return (
    <div>
      <p>{prop.player} — {prop.market}</p>
      <p>Line: {prop.line} | O {formatOdds(prop.overOdds)} / U {formatOdds(prop.underOdds)}</p>
    </div>
  );
}
