import type { Metadata, Viewport } from "next";
// Next.js loads this stylesheet at runtime; TypeScript has no declaration for CSS side-effect imports.
import "./globals.css";
import AppShell from "@/components/navigation/AppShell";
import RunnerAuthProvider from "@/components/auth/RunnerAuthProvider";
import { getRunnerAccess } from "@/lib/auth/access";
import { cookies } from "next/headers";
import GameDaySkinProvider from "@/components/theme/GameDaySkinProvider";
import { GAME_DAY_SKIN_COOKIE, getGameDaySkin } from "@/lib/theme/gameDaySkins";

export const metadata: Metadata = {
  metadataBase: new URL("https://werunsportsandanalytics.com"),
  title: { default: "We Run Sports & Analytics | Runner Sports & Analytics", template: "%s | Runner Sports & Analytics" },
  description: "Runner Sports and Analytics. Sports research, delayed odds comparison, matchup context, and your game-day command center.",
  icons: { icon: "/brand/icon.png" },
  openGraph: { title: "We Run Sports & Analytics", description: "The sports intelligence command center by Runner Sports & Analytics.", type: "website" },
  twitter: { card: "summary_large_image", title: "We Run Sports & Analytics", description: "The sports intelligence command center by Runner Sports & Analytics." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#04081A" };

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getRunnerAccess();
  const preferences = await cookies();
  const initialSkin = getGameDaySkin(preferences.get(GAME_DAY_SKIN_COOKIE)?.value ?? "eagles-kelly");

  return (
    <html lang="en">
      <body>
        <RunnerAuthProvider>
          <GameDaySkinProvider initialSkin={initialSkin.id}><AppShell isAdmin={access.isAdmin}>{children}</AppShell></GameDaySkinProvider>
        </RunnerAuthProvider>
      </body>
    </html>
  );
}
