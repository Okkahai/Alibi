# Game rules

This is what the player is told, and what the solver enforces (`src/lib/engines/solver.ts`).

## The case

- One person was killed, by one culprit, with one method, in one room.
- Every person of interest swears they were elsewhere. **One of them is lying, and the liar is the killer.**
  The solver encodes this as `falseAlibi = culprit`.
- The body was moved after death, so where it was found says nothing about the room.

## Exhibits

Each exhibit is a statement that is true. The wording means exactly one logical form:

| Wording | Meaning |
|---|---|
| "X is not the culprit" / "the killing did not take place at R" | that option is ruled out |
| "Either X is the killer and R the scene, or neither is" | X is the culprit **if and only if** R is the room |
| "If X is the killer, it did not happen at R" / "M was not used at R" | not both |
| "If the culprit is X, then the method is (not) M" | only constrains the case where X is the culprit |

An exhibit about an innocent person is still true. "If Bram did it, it was the cellar" is true whenever Bram is innocent. Being named in an exhibit says nothing by itself.

Every daily has **exactly one** answer reachable from the exhibits alone. A solver checks this before the case can be published, and no exhibit is redundant.

## Playing

1. Examine rooms to recover exhibits (Section I).
2. Mark the deduction matrix (Section VII): ✕ to rule out, ✓ to confirm. A completed grid has exactly one ✓ per block, and the three blocks agree.
3. Hints (three levels: direction, deduction, the mark itself) only use exhibits you have examined. Each costs 3 points.
4. Accuse (Section VIII): culprit, motive, method, room, and the exhibits and events you relied on.

## Scoring

| Part | Points |
|---|---|
| Culprit | 40 |
| Motive | 15 |
| Method | 15 |
| Room (when the case grades one) | 10 |
| Key exhibits (share matched) | 20 |
| Sequence (critical events matched) | 10 |
| Each hint | −3 |

The total is clamped at 0. The verdict is one of three:
- **Case closed:** culprit, method and room are all right.
- **Charged, on a flawed account:** the culprit is right, but the method or room is wrong.
- **Finding overturned:** the culprit is wrong.

The share text names no one and nothing.
