"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/navigation/nav-items";
import NavIcon from "@/components/navigation/NavIcon";
import RunnerLogo from "@/components/brand/RunnerLogo";

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-border md:bg-surface/90 md:shrink-0">
      <div className="px-5 py-5 border-b border-border">
        <RunnerLogo />
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1" aria-label="Product navigation">
        <p className="mb-3 px-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-text-subtle">Intelligence workspace</p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-accent/10 text-text border border-accent/25 shadow-[inset_3px_0_0_var(--color-accent)]"
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
