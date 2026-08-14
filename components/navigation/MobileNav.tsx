"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/components/navigation/nav-items";
import NavIcon from "@/components/navigation/NavIcon";

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <ul className="flex justify-between px-1 py-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1 min-w-[56px]">
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-[10px] ${
                  active ? "text-accent" : "text-text-subtle"
                }`}
              >
                <NavIcon name={item.icon} className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
