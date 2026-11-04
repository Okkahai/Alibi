import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AppShell } from "./app-shell";
import { ChangeCaseButton } from "./change-case-button";

// Variable fonts load without a weight list; passing weight arrays for these two broke the Turbopack build (next/font "queries have exactly one entry").
const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
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

const NAV = [
  { href: "/", label: "Case Desk" },
  { href: "/crime-scene", label: "Crime Scene" },
  { href: "/suspects", label: "Suspects" },
  { href: "/interrogation", label: "Interrogation" },
  { href: "/evidence", label: "Evidence" },
  { href: "/timeline", label: "Timeline" },
  { href: "/evidence-board", label: "Evidence Board" },
  { href: "/accusation", label: "Accusation" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--rule-strong)] bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl px-4 pt-3 pb-2 flex items-end justify-between gap-4">
            <Link href="/" className="leading-none" aria-label="ALIBI — home">
              <span className="block font-[family-name:var(--font-display)] text-3xl font-bold tracking-[0.18em] accent-text">ALIBI</span>
              <span className="specimen-id block mt-1">Bureau of Forensic Record</span>
            </Link>
            <ChangeCaseButton />
          </div>
          <nav aria-label="Investigation sections" className="mx-auto max-w-6xl px-4 flex overflow-x-auto text-xs uppercase tracking-[0.1em]">
            {NAV.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                className="whitespace-nowrap px-3 py-2 border-t border-[var(--border)] hover:bg-[var(--surface-raised)]"
              >
                <span className="mono text-[var(--copper)] mr-1">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
          <AppShell>{children}</AppShell>
        </main>
      </body>
    </html>
  );
}
