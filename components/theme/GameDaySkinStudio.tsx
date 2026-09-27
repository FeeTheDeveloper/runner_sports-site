"use client";

import GameDaySkinSelector from "@/components/theme/GameDaySkinSelector";
import { useGameDaySkin } from "@/components/theme/GameDaySkinProvider";

export default function GameDaySkinStudio() {
  const { skin } = useGameDaySkin();
  return <section className="skin-studio" aria-labelledby="skin-studio-heading">
    <div><p className="launch-eyebrow">Your city. Your colors.</p><h2 id="skin-studio-heading">Set the tone<br />for game day.</h2><p>Start with Eagles Kelly Green. Switch to midnight, the ballpark, the arena, the ice, or the pitch.</p><GameDaySkinSelector /><p className="skin-disclaimer">Fan-inspired color themes. Your selection does not indicate a team schedule, uniform, or affiliation.</p></div>
    <div className="skin-preview" aria-label={`${skin.label} theme preview`}><div className="skin-preview-stripe" /><p className="skin-preview-city">PHILADELPHIA<br /><span>STATE OF MIND.</span></p><div className="skin-preview-footer"><span>{skin.shortLabel}</span><span>RUNNER / GAME DAY</span></div><p>{skin.note}</p></div>
  </section>;
}
