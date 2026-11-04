import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "./app-shell";

// Variable fonts load without a weight list; passing weight arrays for these two broke the Turbopack build (next/font "queries have exactly one entry").
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ALIBI — a daily murder mystery",
  description: "A daily deduction game: one case, one provable answer, no guessing.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
