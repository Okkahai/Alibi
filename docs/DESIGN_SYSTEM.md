# Design System — Forensic Modernism × Victorian Gothic

Status: **v2, redesign in progress.** Implemented: shell (ink masthead, dossier
index), homepage frontispiece, suspects line-up and identification records,
original SVG art. Still on the old layout: scene, exhibits, chronology,
interrogation, board, conclusion. References and the reasoning behind these
rules: `docs/DESIGN_RESEARCH.md`.

The v1 foundation (all-beige paper, boxed cards, eight numbered nav links) was
rejected as reading like a generic admin dashboard. v2 changes the
*composition*, not only tokens.

## Intent

An interactive forensic archive from an alternate Victorian era, set by a
modern editorial studio. Two voices:

- **Record (primary):** ivory sheets, hairline rules, mono field labels,
  reference numbers first (`S-03`, `PL. I`, `Nº 004`), statements marked
  "as stated · unverified". Never boxed cards — records are separated by a
  2px ink rule on top and hairlines between fields.
- **Engraving (secondary):** Cormorant italic display type, line-art plates
  with hatching, the oxblood seal, numbered plates with lettered keys
  (*a*, *b*, *c*) and captions *under* the image.

## Composition rules

1. **One ink band per screen.** Each screen has exactly one dark section that
   carries its image (home: the frontispiece; suspects: the line-up). Records
   and working surfaces stay ivory.
2. **Scale contrast.** One oversized element per screen (the case number at
   10rem, the line-up), everything else small and precise.
3. **Asymmetric two-column grid** (≈ 1.1 : 0.9) on desktop; collapses to one
   column under 1024px with the image *after* the text and action.
4. **No section-link grids.** Navigation is a table of contents (roman
   numeral, title, gloss, dotted leader) on the case page, and a sticky side
   index on investigation screens (a disclosure on mobile).
5. **Masthead carries state, not sections:** wordmark, case number + title,
   exhibits recovered (count + rule), Archive, Close file.

## Colour tokens (`src/app/globals.css`)

| Token | Value | Role |
|---|---|---|
| `--background` | `#f2ebdd` | Archival ivory (page) |
| `--surface` | `#f8f3e8` | Sheet / plate paper |
| `--surface-raised` | `#e9dfcb` | Hover |
| `--border` | `#cbbca1` | Hairlines |
| `--foreground`, `--ink`, `--rule-strong` | `#1c2321` | Ink: text, ink bands, record rules |
| `--muted` | `#5a5952` | Secondary text on ivory |
| `--on-ink` / `--on-ink-muted` | `#ede4d1` / `#aaa392` | Text on ink |
| `--ink-rule` | `#3d4743` | Rules on ink |
| `--accent` | `#682c3b` | Oxblood: primary action, seal, stated claims |
| `--brass` / `--brass-light` | `#9c805a` / `#c4a77c` | Case numerals, labels on ink (large/label use only) |
| `--copper` | `#6f5636` | Reference numbers on ivory |
| `--confirmed` / `--excluded` / `--danger` | `#2f5d50` / `#6e6b62` / `#9b2c1f` | Logical status (always with glyph) |

Brass on ink is for display-size numerals and uppercase labels only. Logical
status always carries a glyph: confirmed `✓`, excluded `✕` + strike,
possible `·`, open `◐`.

## Typography

- **Display:** Cormorant Garamond, normal + italic, lining numerals. Titles
  in italic; case number upright at 6.5–10rem.
- **Body:** IBM Plex Sans 15px / 1.55.
- **Record labels and metadata:** IBM Plex Mono, uppercase `.label`
  (11px, 0.14em tracking), tabular numerals.

## Illustration rules (`src/components/art/`)

- Original hand-authored SVG only; no raster stock, no runtime image APIs,
  no emoji as icons.
- Two inks: line colour + paper. Tone comes from hatching patterns
  (`Hatch`), never gradients or glows.
- Plates are numbered (`PL. I`, `FIG. 1`), framed by a double rule, keyed
  with italic letters, captioned beneath.
- Portraits are Victorian silhouettes (front + profile, Bertillon-style
  pair, height rule on the frame edge), seeded by the character's name so a
  person always looks the same. On ink they invert (ivory silhouette).
- The seal is the single oxblood ornament; one per screen at most.

## Components

`.label`, `.btn`/`.btn-primary` (square, mono uppercase), `.leader` (dotted
contents leader), `.on-ink` (ink band), `.status-*`. `.panel`/`.sheet` remain
only for not-yet-redesigned pages.

## Interaction

Focus: 2px oxblood outline (brass-light on ink). Hover: text turns oxblood;
no lift, no shadow. Motion ≤180ms; `prefers-reduced-motion` disables it.
Touch targets ≥ 44px.
