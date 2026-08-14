import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppShell from "@/components/navigation/AppShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://runnersportsanalytics.com"),
  title: { default: "Runner Sports & Analytics", template: "%s | Runner Sports & Analytics" },
  description: "Sports intelligence, predictive modeling, and bet tracking by Runner Sports & Analytics LLC.",
  icons: { icon: "/brand/runner-logo.jpg" },
  openGraph: { title: "Runner Sports & Analytics", description: "Sports intelligence. Built different.", type: "website" },
  twitter: { card: "summary_large_image", title: "Runner Sports & Analytics", description: "Sports intelligence. Built different." },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#04132E" };

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
