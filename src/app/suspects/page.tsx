"use client";

import Link from "next/link";
import { useGame } from "@/lib/state/game-context";

export default function SuspectsPage() {
  const { truth } = useGame();
  const suspects = truth.characters.filter((c) => c.role !== "victim");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {suspects.map((c) => {
        const claimedLocation = truth.locations.find((l) => l.id === c.claimedLocation)?.name ?? c.claimedLocation;
        return (
          <div key={c.id} className="panel p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{c.name}</h2>
              <span className="text-xs uppercase text-[var(--muted)]">{c.role}</span>
            </div>
            <p className="text-sm text-[var(--muted)]">{c.relationshipToVictim}</p>
            <p className="text-sm">
              Claims to have been at: <span className="accent-text">{claimedLocation}</span>
            </p>
            <p className="text-xs text-[var(--muted)] italic">{c.personality}</p>
            <Link href="/interrogation" className="btn mt-2 self-start">
              Interrogate
            </Link>
          </div>
        );
      })}
    </div>
  );
}
