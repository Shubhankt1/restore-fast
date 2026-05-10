import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "Punch List Tracker",
  description:
    "Construction-ready punch list tracking for projects, items, and closeout progress.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-slate-950 text-slate-50 antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
