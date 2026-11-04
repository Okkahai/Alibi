/**
 * The tutorial's hand-made 3×3 case (§12, §19): every clue removes cells the
 * player must cross out themselves; the last step asks for the single ✓.
 */
import { cellKey, type Block, type Cells } from "@/lib/state/matrix";

const persons = { key: "person", label: "Persons", items: ["Ada Quill", "Bram Hale", "Cora Lind"].map((name) => ({ id: name.split(" ")[0].toLowerCase(), name })) };
const rooms = { key: "room", label: "Rooms", items: ["Library", "Study", "Cellar"].map((name) => ({ id: name.toLowerCase(), name })) };
export const TUTORIAL_BLOCK: Block = { rows: persons, cols: rooms };

const k = (p: string, r: string) => cellKey("person", p, "room", r);
const all = (cells: Cells, keys: string[], mark: "x" | "o") => keys.every((key) => cells[key] === mark);
const row = (p: string) => rooms.items.map((r) => k(p, r.id));
const col = (r: string) => persons.items.map((p) => k(p.id, r));

export interface TutorialStep {
  exhibit: string | null;
  lesson: string;
  done: (cells: Cells) => boolean;
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    exhibit: null,
    lesson:
      "One person killed the victim, in one room. Each cell asks: could the crime be this person in this room? Tap a cell once for ✕ (ruled out), twice for ✓ (proven), a third time to clear. The rule of every case: the one whose alibi breaks is the killer.",
    done: () => true,
  },
  {
    exhibit: "Ada Quill's alibi was independently corroborated.",
    lesson: "Her alibi holds, so by the rule she is not the killer. Cross out every room in Ada's row.",
    done: (c) => all(c, row("ada"), "x"),
  },
  {
    exhibit: "The crime did not take place in the Cellar.",
    lesson: "Nobody could have done it there. Cross out the whole Cellar column.",
    done: (c) => all(c, col("cellar"), "x"),
  },
  {
    exhibit: "If Bram Hale is the killer, it did not happen in the Library.",
    lesson: "A conditional rules out one pairing, not a whole row. Cross out only Bram × Library.",
    done: (c) => c[k("bram", "library")] === "x",
  },
  {
    exhibit: "Bram Hale's story holds up under scrutiny.",
    lesson: "Bram is cleared too. Cross out what is left of his row.",
    done: (c) => all(c, row("bram"), "x"),
  },
  {
    exhibit: "Either Cora Lind is the killer and the Library the scene, or neither is.",
    lesson: "Two cells remain, both Cora's. This exhibit ties Cora to the Library, so Cora × Study is out. Cross it, then mark the last cell ✓.",
    done: (c) => c[k("cora", "study")] === "x" && c[k("cora", "library")] === "o",
  },
];

/** A ✓ anywhere but the answer, or a ✕ on the answer, contradicts the exhibits. */
export function tutorialMistake(cells: Cells): boolean {
  return Object.entries(cells).some(([key, m]) => (key === k("cora", "library") ? m === "x" : m === "o"));
}
