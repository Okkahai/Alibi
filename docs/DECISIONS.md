# Decisions

Short records of choices that are not obvious from the code. Newest last.

1. **No runtime LLM for dailies (2026-11-03).** Cases must be reproducible, free to serve and provably fair. The LLM interrogation remains only for handcrafted cases.
2. **A real solver, not a heuristic (2026-11-04).** A daily ships only if exhaustive search finds exactly one culprit × method × room.
3. **"The liar is the killer" (2026-11-04).** `falseAlibi = culprit` is a stated rule rather than a separate axis. Otherwise text and solver disagreed in about 9% of cases.
4. **Templates carry exact clue semantics (2026-11-04).** "Linked" means *if and only if*, never "suggests". Any wording that is looser than its clue is a bug.
5. **Hints see only what the player has seen (2026-11-04).** No penalty cap, so hints cannot become a free oracle.
6. **Freeze, don't snapshot (2026-11-04).** Published days are protected by a fingerprint test, and generator changes are date-gated. This was chosen over storing full JSON snapshots.
7. **Rules v2: minimal sets with decoys (2026-11-04/05).** A pruned clue set, plus true clues about wrong values, so being named is no tell. The culprit also gets a whereabouts entry, so the Chronology is no tell.
8. **Frequency tells are damped, not eliminated (2026-11-05).** Redraw 70% of the sets where the answer is the single most-named option in then or not-both slots. Wider or harder damping was measured and only moved or inverted the tells, so the remaining 1.3–2× tells are accepted as inherent to minimal sets.
