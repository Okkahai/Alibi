"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useGame } from "@/lib/state/game-context";
import { CaseStamp } from "@/components/alibi/CaseStamp";
import { ChangeCaseButton } from "./change-case-button";
import { getDailyDayNumber, LAUNCH_DATE } from "@/lib/engines/daily-case";
import { loadStreak } from "@/lib/state/streak-storage";

function timeUntilNextUtcMidnight(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const ms = next.getTime() - now.getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export default function TodayPage() {
  const { truth, state } = useGame();
  const [countdown, setCountdown] = useState(timeUntilNextUtcMidnight());
  const [streak, setStreak] = useState({ current: 0, longest: 0 });

  // Hydration step: localStorage isn't available during server render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStreak(loadStreak());
    const id = setInterval(() => setCountdown(timeUntilNextUtcMidnight()), 60_000);
    return () => clearInterval(id);
  }, []);

  const dayNumber = getDailyDayNumber(new Date(), LAUNCH_DATE);
  const inProgress = state.discoveredEvidenceIds.length > 0 || state.conversations.length > 0;
  const solved = state.status !== "in_progress";

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col items-center text-center gap-6">
        <CaseStamp tone="accent">Case #{dayNumber}</CaseStamp>

        <div>
          <h1 className="case-title text-3xl sm:text-4xl font-semibold leading-tight">{truth.title}</h1>
          <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{truth.victim.description}</p>
        </div>

        <Link
          href="/investigation"
          className="btn btn-primary w-full justify-center text-base py-3"
        >
          {solved ? "Review the case" : inProgress ? "Continue investigation" : "Open today's case"}
        </Link>

        <div className="w-full grid grid-cols-2 gap-3 mt-2">
          <div className="panel p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Streak</p>
            <p className="case-title text-2xl mt-1">
              {streak.current} <span className="text-sm text-[var(--muted)] font-sans">day{streak.current === 1 ? "" : "s"}</span>
            </p>
          </div>
          <div className="panel p-4">
            <p className="text-xs uppercase tracking-widest text-[var(--muted)]">Next case</p>
            <p className="case-title text-2xl mt-1">{countdown}</p>
          </div>
        </div>

        <ChangeCaseButton />
      </div>
    </div>
  );
}
