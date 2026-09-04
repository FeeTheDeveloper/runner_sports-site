import type { Metadata, Viewport } from "next";
// The stylesheet is handled by Next.js; the project does not currently provide
// a TypeScript declaration for CSS side-effect imports.
// @ts-expect-error -- Next.js resolves this global stylesheet at build time.
import "./globals.css";
import AppShell from "@/components/navigation/AppShell";
import RunnerAuthProvider from "@/components/auth/RunnerAuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://werunsportsandanalytics.com"),
  title: { default: "We Run Sports and Analytics | Runner Sports & Analytics", template: "%s | Runner Sports & Analytics" },
  description: "Runner Sports and Analytics. Live odds, matchup intelligence, player research, predictive models, and market analysis by Runner Sports & Analytics.",
  icons: { icon: "/brand/icon.png" },
  openGraph: { title: "We Run Sports and Analytics", description: "The sports intelligence command center by Runner Sports & Analytics.", type: "website" },
  twitter: { card: "summary_large_image", title: "We Run Sports and Analytics", description: "The sports intelligence command center by Runner Sports & Analytics." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#04081A" };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RunnerAuthProvider>
          <AppShell>{children}</AppShell>
        </RunnerAuthProvider>
      </body>
    </html>
  );
}
