import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/navigation/AppShell";

export const metadata: Metadata = {
  title: "Runner Sports & Analytics",
  description: "Sports intelligence, predictive modeling, and bet tracking by Runner Sports & Analytics LLC.",
};

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
