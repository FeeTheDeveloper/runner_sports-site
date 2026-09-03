"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/navigation/Sidebar";
import MobileNav from "@/components/navigation/MobileNav";
import Header from "@/components/navigation/Header";
import AgentNavigator from "@/components/navigation/AgentNavigator";
import ResponsibleGamblingNotice from "@/components/legal/ResponsibleGamblingNotice";
import RunnerTicker from "@/components/marketing/RunnerTicker";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const publicPaths = ["/", "/sign-in", "/sign-up", "/pricing", "/checkout/success", "/checkout/cancel"];

  if (publicPaths.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)))) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh bg-canvas">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Header />
        <RunnerTicker />
        <main className="app-content flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-24 xl:px-10">
          <div className="mx-auto w-full max-w-[1500px]">
            {children}
            <footer className="mt-10 border-t border-border pt-4">
              <ResponsibleGamblingNotice />
            </footer>
          </div>
        </main>
      </div>
      <MobileNav />
      <AgentNavigator />
    </div>
  );
}
