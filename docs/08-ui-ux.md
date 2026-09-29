# 08 — UI/UX

## Visual direction

Dark, low-saturation "case file" aesthetic — closer to investigation
software than a narrative game skin. Palette (`src/app/globals.css`):
near-black background (`#0b0d10`), two panel elevation levels (`#14171c`,
`#1b1f26`), a warm brass/amber accent (`#b8863f`) standing in for "evidence
tag" highlighting, and a muted red (`#b3452f`) reserved for danger/incorrect
states. No gradients or decoration beyond a subtle dotted grid on the
Evidence Board, to keep focus on the text-heavy content.

## Pages (MVP)

| Route | Purpose |
|---|---|
| `/` (Case Desk) | Case summary, progress counters, links to every other page |
| `/crime-scene` | Location list → per-location evidence search/discovery |
| `/suspects` | Suspect roster: relationship, claimed location, personality |
| `/interrogation` | Per-suspect chat, evidence-confrontation dropdown |
| `/evidence` | Log of everything discovered so far |
| `/timeline` | Chronological event list; entries stay locked until evidence unlocks them |
| `/evidence-board` | Pin suspects/evidence/locations/events as cards, click two to connect them, freeform notes |
| `/accusation` | Culprit/motive/method/evidence/timeline submission → score + full case reveal |

## Interaction patterns worth calling out

- **Crime Scene → Evidence is a two-step reveal.** A location lists what
  evidence exists there before it's examined ("Something here might be
  worth a closer look"), then reveals the real description only after the
  player clicks Examine. This keeps the Evidence page meaningful as a
  player-built log rather than a spoiler list.
- **Timeline entries are locked by default.** An event only shows its
  description once evidence tying to it (via `relatedEventIds`) has been
  discovered — reinforces "reconstruct the timeline," rather than handing
  it over up front.
- **Evidence Board uses click-to-connect, not drag-and-drop**, for MVP
  simplicity — click one card, click another, a line is drawn between them.
  Cards are placed at randomized positions when pinned; free positioning
  (drag) is a natural next iteration (`docs/10-roadmap.md`) once the
  interaction is proven.
- **Interrogation's evidence dropdown gates itself** to only the player's
  discovered evidence (`state.discoveredEvidenceIds`), so the UI can't even
  construct a request that the engine would reject — the constraint is
  visible before the player acts, not just enforced after.

## What's explicitly deferred past MVP

- Suspect portraits/likenesses (currently text-only cards).
- Drag-and-drop, resizable Evidence Board.
- A dedicated Crime Scene "walk" visualization (currently a location list +
  detail panel, not a spatial map).
- Difficulty selector / case picker UI (only one case exists; the picker
  becomes meaningful once `docs/09`'s "MVP → procedural generation" step
  ships).

See `docs/10-roadmap.md` for sequencing.
