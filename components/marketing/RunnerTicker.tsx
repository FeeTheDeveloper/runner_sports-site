"use client";

import { useEffect, useState } from "react";

const feeds = [
  ["RUNNER SPECIAL", "Best Plays of the Day updates after every market sync"],
  ["MARKET ALERT", "Line movement, no-vig probability and book consensus in one board"],
  ["PLAYER LAB", "Props, usage, matchup splits and injury context without the noise"],
  ["GAME CENTER", "ESPN facts meet sportsbook pricing and Runner model intelligence"],
  ["SYSTEM FINDER", "Search historical situations and surface today's qualifiers"],
  ["WE RUN SPORTS", "NFL · NBA · MLB · NHL · NCAA · WNBA · UFC · GOLF"],
];

export default function RunnerTicker() {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setOffset((current) => (current + 1) % feeds.length), 5500);
    return () => window.clearInterval(timer);
  }, []);
  const ordered = [...feeds.slice(offset), ...feeds.slice(0, offset)];
  return (
    <div className="ticker-shell" aria-label="Runner specials and platform updates">
      <div className="ticker-label"><span className="live-dot" /> RUNNER WIRE</div>
      <div className="ticker-window"><div className="ticker-track">{[...ordered, ...ordered].map(([label, copy], index) => <span className="ticker-item" key={`${label}-${index}`}><b>{label}</b><span>{copy}</span><i>◆</i></span>)}</div></div>
    </div>
  );
}
