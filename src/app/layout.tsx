import type { Metadata } from "next";
import { Geist, Geist_Mono, Spectral } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { AppShell } from "./app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display serif for case titles and headline moments only — brand-justified
// per docs/12-design-system.md (editorial case-file identity), never for
// interface controls or data, which stay in Geist Sans.
const caseSerif = Spectral({
  variable: "--font-case-serif",
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "ALIBI",
  description: "A daily detective case. Investigate, accuse, compare notes tomorrow.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${caseSerif.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--surface)] h-14 shrink-0">
          <div className="mx-auto max-w-6xl h-full px-4 flex items-center justify-between">
            <Link href="/" className="case-title text-lg font-semibold tracking-wide text-[var(--foreground)]">
              ALIBI
            </Link>
          </div>
        </header>
        <main className="flex-1 flex flex-col min-h-0">
          <AppShell>{children}</AppShell>
        </main>
      </body>
    </html>
  );
}
