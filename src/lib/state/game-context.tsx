"use client";

/**
 * Client-side save system for the MVP. Persists GameState to localStorage,
 * keyed by case id, so a player can leave and resume later without a
 * database — the Postgres-backed save (src/lib/db) is the durable path for
 * a signed-in/multi-device future, this is the zero-setup one for now.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { GameState, Conversation, BoardNode, BoardConnection } from "@/lib/schema/game-state";
import type { CaseTruth } from "@/lib/schema/case-truth";

function storageKey(caseId: string) {
  return `coldcase:save:${caseId}`;
}

function freshState(caseId: string, seed: string): GameState {
  const now = new Date().toISOString();
  return {
    caseId,
    seed,
    discoveredEvidenceIds: [],
    visitedLocationIds: [],
    conversations: [],
    boardNodes: [],
    boardConnections: [],
    playerNotes: "",
    accusation: null,
    status: "in_progress",
    createdAt: now,
    updatedAt: now,
  };
}

interface GameContextValue {
  truth: CaseTruth;
  state: GameState;
  discoverEvidence: (evidenceId: string) => void;
  visitLocation: (locationId: string) => void;
  appendTurn: (characterId: string, turn: Conversation["turns"][number]) => void;
  setNotes: (notes: string) => void;
  addBoardNode: (node: BoardNode) => void;
  removeBoardNode: (nodeId: string) => void;
  addBoardConnection: (connection: BoardConnection) => void;
  submitAccusation: (accusation: NonNullable<GameState["accusation"]>) => void;
  resetSave: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ truth, children }: { truth: CaseTruth; children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => freshState(truth.id, truth.seed));
  const [hydrated, setHydrated] = useState(false);

  // Reads the save once on mount. Server render always starts fresh, then this
  // effect swaps in the real save client-side — a deliberate hydration step,
  // not a state-sync loop, so the setState-in-effect lint rule is suppressed here.
  useEffect(() => {
    const raw = window.localStorage.getItem(storageKey(truth.id));
    if (raw) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(JSON.parse(raw));
      } catch {
        // corrupted save, start fresh
      }
    }
    setHydrated(true);
  }, [truth.id]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey(truth.id), JSON.stringify(state));
  }, [state, hydrated, truth.id]);

  const value = useMemo<GameContextValue>(
    () => ({
      truth,
      state,
      discoverEvidence: (evidenceId) =>
        setState((s) =>
          s.discoveredEvidenceIds.includes(evidenceId)
            ? s
            : { ...s, discoveredEvidenceIds: [...s.discoveredEvidenceIds, evidenceId], updatedAt: new Date().toISOString() }
        ),
      visitLocation: (locationId) =>
        setState((s) =>
          s.visitedLocationIds.includes(locationId)
            ? s
            : { ...s, visitedLocationIds: [...s.visitedLocationIds, locationId], updatedAt: new Date().toISOString() }
        ),
      appendTurn: (characterId, turn) =>
        setState((s) => {
          const existing = s.conversations.find((c) => c.characterId === characterId);
          const conversations = existing
            ? s.conversations.map((c) => (c.characterId === characterId ? { ...c, turns: [...c.turns, turn] } : c))
            : [...s.conversations, { characterId, turns: [turn] }];
          return { ...s, conversations, updatedAt: new Date().toISOString() };
        }),
      setNotes: (notes) => setState((s) => ({ ...s, playerNotes: notes, updatedAt: new Date().toISOString() })),
      addBoardNode: (node) => setState((s) => ({ ...s, boardNodes: [...s.boardNodes, node], updatedAt: new Date().toISOString() })),
      removeBoardNode: (nodeId) =>
        setState((s) => ({
          ...s,
          boardNodes: s.boardNodes.filter((n) => n.id !== nodeId),
          boardConnections: s.boardConnections.filter((c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId),
          updatedAt: new Date().toISOString(),
        })),
      addBoardConnection: (connection) =>
        setState((s) => ({ ...s, boardConnections: [...s.boardConnections, connection], updatedAt: new Date().toISOString() })),
      submitAccusation: (accusation) =>
        setState((s) => ({ ...s, accusation, status: "accused", updatedAt: new Date().toISOString() })),
      resetSave: () => setState(freshState(truth.id, truth.seed)),
    }),
    [truth, state]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within a GameProvider");
  return ctx;
}
