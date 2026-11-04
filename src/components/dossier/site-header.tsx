"use client";

import Link from "next/link";
import { CASE_SELECTION_KEY } from "@/lib/state/case-select";

/**
 * Ink masthead: wordmark, the open case's number, archive access and
 * progress. Deliberately not a row of section links — the dossier's contents
 * live on the case page and in the side index.
 */
export function SiteHeader({
  caseNumber,
  caseTitle,
  progress,
}: {
  caseNumber?: string | null;
  caseTitle?: string;
  progress?: { found: number; total: number };
}) {
  return (
    <header className="on-ink border-b border-[var(--ink-rule)]">
      <div className="mx-auto max-w-7xl px-4 md:px-8 h-16 flex items-center gap-6">
        <Link href="/" className="flex items-baseline gap-3 shrink-0" aria-label="ALIBI — today's case">
          <span className="display text-[1.9rem] font-bold tracking-[0.22em] text-[var(--on-ink)]">ALIBI</span>
          <span className="label hidden lg:inline text-[var(--on-ink-muted)]">Bureau of Forensic Record</span>
        </Link>

        <div className="ml-auto flex items-center gap-5 md:gap-8 text-[var(--on-ink-muted)]">
          {caseTitle && (
            <p className="label hidden md:block truncate max-w-[22rem]">
              <span className="text-[var(--brass-light)]">Case Nº {caseNumber ?? "—"}</span>
              <span className="mx-2">/</span>
              {caseTitle}
            </p>
          )}
          {progress && (
            <p className="label flex items-center gap-2" aria-label={`${progress.found} of ${progress.total} exhibits recovered`}>
              <span className="hidden sm:inline">Exhibits</span>
              <span className="text-[var(--on-ink)]">
                {String(progress.found).padStart(2, "0")}/{String(progress.total).padStart(2, "0")}
              </span>
              <span className="hidden sm:block w-16 h-px bg-[var(--ink-rule)] relative" aria-hidden="true">
                <span className="absolute inset-y-0 left-0 bg-[var(--brass-light)]" style={{ width: `${(progress.found / Math.max(progress.total, 1)) * 100}%`, height: 2, top: -0.5 }} />
              </span>
            </p>
          )}
          <Link href="/#archive" className="label hover:text-[var(--on-ink)]">
            Archive
          </Link>
          {caseTitle && (
            <button
              className="label hover:text-[var(--on-ink)]"
              onClick={() => {
                window.localStorage.removeItem(CASE_SELECTION_KEY);
                // Full reload so AppShell's in-memory selection and GameProvider actually reset.
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.href = "/";
              }}
            >
              Close file
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
