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
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setOffset((current) => (current + 1) % feeds.length), 5500);
    return () => window.clearInterval(timer);
  }, []);
  const ordered = [...feeds.slice(offset), ...feeds.slice(0, offset)];
  const repeated = [...ordered, ...ordered];
  return (
    <div className="ticker-shell" aria-label="Runner specials and platform updates">
      <div className="ticker-label"><span className="live-dot" aria-hidden="true" /> RUNNER WIRE</div>
      <div className="ticker-window"><div className="ticker-track">{repeated.map(([label, copy], index) => <span className="ticker-item" key={`${label}-${index >= ordered.length ? "repeat" : "primary"}`}><b>{label}</b><span>{copy}</span><i aria-hidden="true">◆</i></span>)}</div></div>
    </div>
  );
}
