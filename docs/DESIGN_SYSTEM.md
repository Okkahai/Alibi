# Design System — Forensic Modernism × Victorian Gothic

Status: **foundation implemented** (tokens, type, base components in
`src/app/globals.css`, shell in `src/app/layout.tsx`). Page-level layouts
(Today's case, deduction matrix, reveal) are still the old structure and get
rebuilt in the vertical-slice phase. This file is the source of truth for the
visual language; pages must use these tokens, never raw colours.

## Intent

A fictional forensic archive from an alternate Victorian era, set with modern
editorial discipline. The *primary* voice is the laboratory report: numbered
sections, fine rules, specimen identifiers, tabular metadata. The *secondary*
voice is Victorian print: a serif display face, burgundy ink, oxidised copper,
restrained ornament. Usability first — decoration never carries information.

Rejected looks: SaaS dashboard (rounded cards, glow, gradients), horror-menu
templates, beige texture behind ordinary cards, glassmorphism.

## Colour tokens

Light, paper-first. A dark variant was considered and deferred: the archival
identity depends on ink-on-paper contrast, and a second theme doubles QA for
little gameplay value right now.

| Token | Value | Role |
|---|---|---|
| `--background` | `#efe9dc` | Archival paper (page) |
| `--surface` | `#f7f3ea` | Aged ivory (sheets, panels) |
| `--surface-raised` | `#e6dfcf` | Folder card / hover |
| `--border` | `#c9bfab` | Fine rules |
| `--rule-strong` | `#1d1a16` | Section rules, table heads |
| `--foreground` | `#1d1a16` | Ink black (body text) |
| `--muted` | `#5f584d` | Faded stone (secondary text) |
| `--accent` | `#6b2232` | Burgundy ink (primary action, headings marks) |
| `--accent-foreground` | `#f7f3ea` | Text on burgundy |
| `--copper` | `#7a4f24` | Oxidised copper (evidence, specimen IDs) |
| `--confirmed` | `#2f5d50` | Verdigris (confirmed deduction) |
| `--excluded` | `#74695a` | Stone (eliminated possibility) |
| `--warning` | `#735510` | Ochre |
| `--danger` | `#9b2c1f` | Error / incorrect |

Measured contrast on `--surface` / `--background`: foreground 15.7 / 14.3,
muted 6.3 / 5.8, accent 10.0 / 9.1, copper 6.4 / 5.8, confirmed 6.8 / 6.2,
warning 6.3 / 5.7, danger 6.8 / 6.3 — all WCAG AA for body text. `--excluded`
is 4.9 / 4.4: deliberately de-emphasised, only ever used together with the
`✕` glyph and strike-through, never as the sole carrier of meaning.

**Never colour alone.** Logical status always carries a glyph and a word:
confirmed `✓`, excluded `✕` + strike-through, possible `·`. The `.status-*`
classes in `globals.css` encode this.

## Typography

- **Display / headings:** Cormorant Garamond (600/700) — Victorian book serif,
  used for case titles and section headings only.
- **Interface / body:** IBM Plex Sans — neutral, highly legible at small sizes.
- **Metadata:** IBM Plex Mono with tabular numerals — case numbers, times,
  specimen IDs (`EV-07`), dates.

All three via `next/font/google` (self-hosted at build, no runtime request).

## Components (base)

- `.sheet` — a document page: ivory surface, 1px rule, square corners,
  no shadow. Replaces rounded dashboard cards (`.panel` is kept as an alias so
  existing pages restyle without rewrites).
- `.section-head` — numbered section header: mono index (`§ 02`), serif title,
  hairline rule under.
- `.specimen-id` — copper mono label for evidence/case identifiers.
- `.btn`, `.btn-primary` — rectangular, uppercase-tracked small caps label;
  primary is burgundy.
- `.status-confirmed / -excluded / -possible` — glyph + colour + (for
  excluded) strike-through.
- Focus: 2px burgundy outline with offset on every interactive element
  (`:focus-visible`).

## Motion

Short and optional: 120–180 ms opacity/transform for reveals and stamps.
`prefers-reduced-motion: reduce` disables all transitions/animations.

## Responsive

Desktop-first (multi-column workspace), collapsing to one column under
`768px`. Tap targets ≥ 44px on touch. The shell nav scrolls horizontally on
small screens rather than wrapping into a second row.
