"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOSSIER } from "./sections";

/** Side index of the dossier on investigation screens; collapses to a disclosure on small screens. */
export function DossierRail({ caseNumber, caseTitle }: { caseNumber: string | null; caseTitle: string }) {
  const pathname = usePathname();
  const current = DOSSIER.find((s) => s.href === pathname);

  const list = (
    <ol className="flex flex-col">
      {DOSSIER.map((s) => {
        const active = s.href === pathname;
        return (
          <li key={s.href}>
            <Link
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`grid grid-cols-[2.25rem_1fr] items-baseline py-2 pl-3 border-l-2 ${
                active ? "border-[var(--accent)] text-[var(--foreground)]" : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="display text-lg italic text-[var(--copper)]">{s.numeral}</span>
              <span className={active ? "font-semibold" : ""}>{s.label}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );

  return (
    <nav aria-label="Case dossier" className="lg:sticky lg:top-6 self-start">
      <Link href="/" className="hidden lg:block mb-4 pb-3 border-b border-[var(--rule-strong)]">
        <span className="label text-[var(--copper)]">Dossier · Nº {caseNumber ?? "—"}</span>
        <span className="display block text-xl mt-1">{caseTitle}</span>
      </Link>
      <div className="hidden lg:block">{list}</div>
      <details className="lg:hidden border-y border-[var(--rule-strong)]">
        <summary className="py-3 cursor-pointer flex items-baseline gap-3 list-none">
          <span className="label text-[var(--copper)]">Dossier</span>
          <span className="display text-lg italic text-[var(--copper)]">{current?.numeral}</span>
          <span className="font-semibold">{current?.label ?? "Contents"}</span>
          <span className="ml-auto label">Contents ▾</span>
        </summary>
        <div className="pb-3">{list}</div>
      </details>
    </nav>
  );
}
