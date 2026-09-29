import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { GameProvider } from "@/lib/state/game-context";
import { theVossManorCase } from "@/data/cases";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ColdCase AI",
  description: "AI-powered detective investigation game with an immutable case truth.",
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
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-sm font-semibold tracking-wide accent-text">
              COLDCASE AI
            </Link>
            <nav className="flex gap-1 overflow-x-auto text-sm">
              {NAV.map((item) => (
                <Link key={item.href} href={item.href} className="px-2 py-1 rounded hover:bg-[var(--surface-raised)] whitespace-nowrap">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">
          <GameProvider truth={theVossManorCase}>{children}</GameProvider>
        </main>
      </body>
    </html>
  );
}
