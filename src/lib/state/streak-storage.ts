"use client";

import { EMPTY_STREAK, type DailyStreak } from "@/lib/engines/streak";

const KEY = "alibi:dailyStreak";

export function loadStreak(): DailyStreak {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : EMPTY_STREAK;
  } catch {
    return EMPTY_STREAK;
  }
}

export function saveStreak(streak: DailyStreak): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(streak));
  } catch {
    // localStorage unavailable (private mode, etc.) — streak just won't persist.
  }
}
