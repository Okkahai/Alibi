# 12 — Design System (v1 foundation)

First design deliverable for the ALIBI redesign (Gün, 2026-09-29): visual
foundation plus three representative screens, using real case data. Scope
was deliberately limited to these three per the brief, so the language can
be reviewed before propagating to the rest of the app.

## Design read

A daily detective puzzle game (Wordle-style) for mobile and desktop, in a
restrained noir case-file register: near-black warm charcoal, off-white
paper, one muted-red accent for critical moments (evidence, accusation,
results). Not a SaaS dashboard, not glassmorphism, not an AI-chat UI.

## Tokens (`src/app/globals.css`)

- `--background` / `--surface` / `--surface-raised`: three near-black steps,
  warm rather than pure black.
- `--foreground` / `--paper`: one off-white, used for text and "paper" areas.
- `--accent` (`#b6432c`, muted red): the only accent color, used identically
  everywhere (culprit stamps, primary buttons, key numbers). `--danger` is
  now an alias of `--accent` (kept for `evidence-board`, not yet restyled).
- One corner-radius scale (`--radius`, soft ~8px) and one shadow-free
  materiality: hierarchy comes from `panel` / `panel-raised` backgrounds and
  borders, not elevation.

## Typography

- **Display serif** (`Spectral`, via `next/font/google`, `--font-case-serif`,
  `.case-title` utility): case titles, headline numbers (score %, case
  number), nothing interactive. Brand-justified per the brief's explicit
  "editorial/serif" ask.
- **Sans** (Geist, already in use): every control, label, and body string.

## Primitives (`src/components/alibi/`)

Only two so far, because only two are reused across the three screens:

- `CaseStamp`: the rotated-border "CASE #N" / "CASE #N SOLVED" label.
- `MoveCounter`: remaining/budget, turns red under 3 remaining. No filled
  progress-bar track (avoided per house style: those read as dashboard UI).

More primitives (`EvidenceCard`, `SuspectCard`, `ContradictionBadge`, ...)
get created when a second screen actually needs them, not speculatively.

## The three screens

1. **Today** (`src/app/page.tsx`): case stamp, title, spoiler-free premise
   (victim + description, never the solution), primary CTA, streak,
   countdown to next UTC day.
2. **Investigation workspace** (`src/app/investigation/page.tsx`): the
   three-region shell (left: Locations/Suspects/Evidence nav, center: active
   content, right: moves + notes). Interrogation/Timeline/Evidence
   Board/Accusation stay as separate routes for now, linked from the left
   nav's lower section, since unifying all ten IA sections is the
   propagation phase, not this deliverable.
3. **Result** (`src/app/accusation/page.tsx`, the post-submit branch): score,
   per-category correct/missed grid, moves used, streak/best (read from
   `src/lib/state/streak-storage.ts`), spoiler-free emoji share text (reused
   from `formatDailyShareText()`, unchanged), then the full reveal.

## Daily-first navigation

`AppShell` now defaults a first-time visitor straight into today's daily
case (`getDailySelection()`) instead of the case picker, per the "site open
→ today's case → investigation, quickly" requirement. The picker is still
reachable at `/?practice` for generated/handcrafted practice play
(`ChangeCaseButton`).

## Real move tracking

`GameProvider.discoverEvidence` and `appendTurn` (player turns only) now
increment `GameState.movesUsed`, so `MoveCounter` and the Result screen's
"moves used" stat show real numbers, not fixtures.

## Deliberately deferred (not silently dropped)

- **shadcn/ui, Motion/Framer Motion, React Flow**: none of the three
  screens in this deliverable needed a dialog, drawer, or graph interaction,
  so none were installed (avoids dependency accumulation on components with
  no caller yet). They're the right call once Interrogation (Sheet/Dialog
  for evidence confrontation) and Evidence Board (React Flow) are built.
- **Sub-pages not yet restyled**: `crime-scene`, `suspects`, `evidence`,
  `timeline`, `evidence-board`, `interrogation` still use the pre-redesign
  look. They're functionally unchanged and still reachable (linked from the
  investigation workspace's lower nav), just not visually propagated yet.
- **Mobile bottom nav**: the investigation workspace's left nav collapses to
  a horizontal tab row on mobile rather than a bottom nav/drawer; works, but
  the brief's suggested bottom-nav pattern is worth a pass once all IA
  sections live in one workspace.
