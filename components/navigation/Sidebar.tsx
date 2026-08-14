"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/navigation/nav-items";
import NavIcon from "@/components/navigation/NavIcon";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-surface md:shrink-0">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="h-8 w-8 rounded-md bg-accent/15 border border-accent/30 flex items-center justify-center text-accent font-mono font-semibold text-sm">
          R
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold tracking-wide text-text">RUNNER</p>
          <p className="text-[11px] text-text-subtle tracking-wide">SPORTS &amp; ANALYTICS</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-surface-3 text-text border border-border-strong"
                  : "text-text-muted hover:text-text hover:bg-surface-2 border border-transparent"
              }`}
            >
              <NavIcon name={item.icon} className={`h-4 w-4 ${active ? "text-accent" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-border">
        <p className="text-[11px] text-text-subtle leading-relaxed">
          Runner Sports &amp; Analytics LLC
          <br />
          Phase 1 — simulated data
        </p>
      </div>
    </aside>
  );
}
