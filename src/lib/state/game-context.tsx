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

const PLAYER_ID_KEY = "coldcase:playerId";

/** A stable per-browser id, used only to key server-side saves — not an account system. */
function getPlayerId(): string {
  let id = window.localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(PLAYER_ID_KEY, id);
  }
  return id;
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
    movesUsed: 0,
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
    let cancelled = false;
    const localRaw = window.localStorage.getItem(storageKey(truth.id));
    let local: GameState | null = null;
    if (localRaw) {
      try {
        local = JSON.parse(localRaw);
      } catch {
        // corrupted save, ignore
      }
    }

    // Best-effort: the server save (Postgres, via /api/saves) is additive to
    // localStorage, not a replacement for it — if it's unreachable (no
    // DATABASE_URL configured, network error), the local save still works.
    const playerId = getPlayerId();
    fetch(`/api/saves?caseId=${encodeURIComponent(truth.id)}&playerId=${encodeURIComponent(playerId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const remote: GameState | null = data?.save ?? null;
        // Prefer whichever save was updated more recently.
        const winner =
          remote && (!local || new Date(remote.updatedAt) > new Date(local.updatedAt)) ? remote : local;
        if (winner) {
          setState(winner);
        }
        setHydrated(true);
      })
      .catch(() => {
        if (cancelled) return;
        if (local) {
          setState(local);
        }
        setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [truth.id]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey(truth.id), JSON.stringify(state));

    // Best-effort remote sync, debounced so rapid state changes (typing notes,
    // a burst of evidence discovery) don't fire a request per keystroke.
    const playerId = getPlayerId();
    const timeout = setTimeout(() => {
      fetch("/api/saves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, state }),
      }).catch(() => {
        // No server-side persistence available (e.g. DATABASE_URL unset) — localStorage already has it.
      });
    }, 800);
    return () => clearTimeout(timeout);
  }, [state, hydrated, truth.id]);

  const value = useMemo<GameContextValue>(
    () => ({
      truth,
      state,
      discoverEvidence: (evidenceId) =>
        setState((s) =>
          s.discoveredEvidenceIds.includes(evidenceId)
            ? s
            : {
                ...s,
                discoveredEvidenceIds: [...s.discoveredEvidenceIds, evidenceId],
                movesUsed: s.movesUsed + 1,
                updatedAt: new Date().toISOString(),
              }
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
          const movesUsed = turn.speaker === "player" ? s.movesUsed + 1 : s.movesUsed;
          return { ...s, conversations, movesUsed, updatedAt: new Date().toISOString() };
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
