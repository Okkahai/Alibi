/** The case dossier's table of contents: one entry per investigation screen. */
export const DOSSIER = [
  { href: "/crime-scene", numeral: "I", label: "The Scene", gloss: "Walk the rooms and search for exhibits." },
  { href: "/suspects", numeral: "II", label: "Persons of Interest", gloss: "Identification records and stated whereabouts." },
  { href: "/interrogation", numeral: "III", label: "Interrogation", gloss: "Question each person; confront a lie with proof." },
  { href: "/evidence", numeral: "IV", label: "Exhibits", gloss: "The specimen catalogue of everything recovered." },
  { href: "/timeline", numeral: "V", label: "Chronology", gloss: "The night, set down in order." },
  { href: "/evidence-board", numeral: "VI", label: "The Board", gloss: "Pin persons, exhibits and events together." },
  { href: "/deduction", numeral: "VII", label: "The Matrix", gloss: "Rule out and confirm every pairing, one cell at a time." },
  { href: "/accusation", numeral: "VIII", label: "Conclusion", gloss: "Submit the finding: who, how, and the proof." },
] as const;
