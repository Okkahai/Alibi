"use client";

import { useGame } from "@/lib/state/game-context";
import { Frontispiece } from "@/components/dossier/frontispiece";
import { readSelection } from "@/components/dossier/case-meta";

export default function CaseDesk() {
  const { truth, state } = useGame();
  return (
    <Frontispiece
      truth={truth}
      mode={{ kind: "active", selection: readSelection(), found: state.discoveredEvidenceIds.length, status: state.status }}
    />
  );
}
