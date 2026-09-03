"use client";

import { useState } from "react";
import Link from "next/link";
import { navItems } from "@/components/navigation/nav-items";
import NavIcon from "@/components/navigation/NavIcon";

export default function AgentNavigator() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {open && (
        <section className="mb-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border-strong bg-surface shadow-[0_24px_80px_rgba(0,4,18,.55)]" aria-label="Runner navigation assistant">
          <div className="border-b border-border bg-surface-2 p-4">
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-semibold text-text">Runner Guide</p><p className="mt-0.5 text-xs text-text-muted">Navigation assistant preview</p></div>
              <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-1 text-[9px] font-bold tracking-wider text-warning">PREVIEW</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-sm leading-6 text-text-muted">Where would you like to go?</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-canvas/50 px-3 text-xs font-medium text-text-muted transition hover:border-accent/30 hover:bg-accent/5 hover:text-text">
                  <NavIcon name={item.icon} className="h-4 w-4 text-accent" />{item.label}
                </Link>
              ))}
            </div>
            <p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-text-subtle">A conversational agent can connect here later to guide research using verified Runner data.</p>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={open ? "Close Runner Guide" : "Open Runner Guide"} className="ml-auto flex h-12 items-center gap-2 rounded-full border border-accent/35 bg-accent px-4 text-sm font-bold text-white shadow-[0_12px_40px_rgba(229,18,43,.3)] transition hover:-translate-y-0.5 hover:bg-accent-strong">
        <span className="text-lg" aria-hidden="true">✦</span>{open ? "Close" : "Ask Runner"}
      </button>
    </div>
  );
}
