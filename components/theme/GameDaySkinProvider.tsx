"use client";

import { createContext, useContext, useState, type CSSProperties, type ReactNode } from "react";
import { GAME_DAY_SKIN_COOKIE, getGameDaySkin, type GameDaySkinId } from "@/lib/theme/gameDaySkins";

const SkinContext = createContext<{
  skin: ReturnType<typeof getGameDaySkin>;
  changeSkin: (id: GameDaySkinId) => void;
  message: string;
} | null>(null);

export default function GameDaySkinProvider({ initialSkin, children }: { initialSkin: GameDaySkinId; children: ReactNode }) {
  const [skinId, setSkinId] = useState(initialSkin);
  const [message, setMessage] = useState("");
  const skin = getGameDaySkin(skinId);

  function changeSkin(id: GameDaySkinId) {
    const selected = getGameDaySkin(id);
    setSkinId(selected.id);
    let saved = false;
    try {
      document.cookie = `${GAME_DAY_SKIN_COOKIE}=${selected.id}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
      saved = document.cookie.split("; ").includes(`${GAME_DAY_SKIN_COOKIE}=${selected.id}`);
    } catch { /* A blocked preference cookie must never block the visual change. */ }
    setMessage(`${selected.label} applied${saved ? ". Saved on this browser." : " for this visit. Browser storage is unavailable."}`);
  }

  const tokens = {
    "--skin-accent": skin.accent,
    "--skin-action": skin.action,
    "--skin-wash": skin.wash,
    "--skin-secondary": skin.secondary,
  } as CSSProperties;

  return <SkinContext.Provider value={{ skin, changeSkin, message }}><div className="runner-skin-root" data-runner-skin={skin.id} style={tokens}>{children}<span className="sr-only" role="status" aria-live="polite">{message}</span></div></SkinContext.Provider>;
}

export function useGameDaySkin() {
  const value = useContext(SkinContext);
  if (!value) throw new Error("Game-day skins require GameDaySkinProvider");
  return value;
}
