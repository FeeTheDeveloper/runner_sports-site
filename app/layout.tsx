import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/navigation/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://werunsportsandanalytics.com"),
  title: { default: "We Run Sports and Data | Runner Sports & Analytics", template: "%s | Runner Sports & Analytics" },
  description: "We run sports and data. Live odds, matchup intelligence, player research, predictive models, and market analysis by Runner Sports & Analytics.",
  icons: { icon: "/brand/icon.png" },
  openGraph: { title: "We Run Sports and Data", description: "The sports intelligence command center by Runner Sports & Analytics.", type: "website" },
  twitter: { card: "summary_large_image", title: "We Run Sports and Data", description: "The sports intelligence command center by Runner Sports & Analytics." },
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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
