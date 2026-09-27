"use client";

import { useId } from "react";
import { GAME_DAY_SKINS, type GameDaySkinId } from "@/lib/theme/gameDaySkins";
import { useGameDaySkin } from "@/components/theme/GameDaySkinProvider";

export default function GameDaySkinSelector({ compact = false }: { compact?: boolean }) {
  const id = useId();
  const { skin, changeSkin } = useGameDaySkin();
  return <div className={`game-day-selector${compact ? " game-day-selector--compact" : ""}`}>
    <label htmlFor={id}>Game-day skin</label>
    <div className="game-day-selector-control"><span className="skin-swatch" aria-hidden="true" /><select id={id} value={skin.id} onChange={(event) => changeSkin(event.target.value as GameDaySkinId)} aria-describedby={`${id}-feedback`}>
      {GAME_DAY_SKINS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
    </select></div>
    <span id={`${id}-feedback`} className="sr-only">Applies immediately. Saved on this browser when preference storage is available.</span>
  </div>;
}
