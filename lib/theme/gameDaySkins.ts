// Expressive fan palettes only. They never alter success, warning or danger.
export const GAME_DAY_SKIN_COOKIE = "runner_game_day_skin";
export const GAME_DAY_SKINS = [
  { id: "runner", label: "Runner original", shortLabel: "Runner", accent: "#ff5269", action: "#bd1630", wash: "#281026", secondary: "#94bce8", note: "Navy. Red. Runner." },
  { id: "eagles-kelly", label: "Eagles · Kelly Green", shortLabel: "Kelly Green", accent: "#54d99a", action: "#087641", wash: "#082b21", secondary: "#d1e1d8", note: "A little more Philly. A lot more green." },
  { id: "eagles-midnight", label: "Eagles · Midnight Green", shortLabel: "Midnight Green", accent: "#6dd5cf", action: "#075f61", wash: "#07282d", secondary: "#c4d7da", note: "Midnight green. All-day focus." },
  { id: "phillies", label: "Phillies · Red & blue", shortLabel: "Phillies", accent: "#ff8192", action: "#b01e36", wash: "#2f1228", secondary: "#95bbff", note: "Red, blue, and a ballpark state of mind." },
  { id: "sixers", label: "76ers · Red & blue", shortLabel: "Sixers", accent: "#8bbcff", action: "#245dac", wash: "#11244b", secondary: "#ff91a4", note: "Bring the arena with you." },
  { id: "flyers", label: "Flyers · Orange & black", shortLabel: "Flyers", accent: "#ffa466", action: "#a7430c", wash: "#2c1b12", secondary: "#e1e2e6", note: "Orange energy. Ice-cold attention." },
  { id: "union", label: "Union · Navy & gold", shortLabel: "Union", accent: "#e9ce83", action: "#715722", wash: "#25261d", secondary: "#9eb9d4", note: "Navy, gold, and the beautiful game." },
] as const;

export type GameDaySkinId = (typeof GAME_DAY_SKINS)[number]["id"];
export function getGameDaySkin(value: string | undefined) {
  return GAME_DAY_SKINS.find((skin) => skin.id === value) ?? GAME_DAY_SKINS[0];
}
