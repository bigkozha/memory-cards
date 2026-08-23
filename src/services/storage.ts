import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserProgress } from "../types";

const KEY = "@memory-cards/progress/v1";

export const emptyProgress: UserProgress = {
  xp: 0,
  streakDays: 0,
  cardProgress: {},
  sessions: [],
};

export async function loadProgress(): Promise<UserProgress> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { ...emptyProgress };
    const parsed = JSON.parse(raw) as UserProgress;
    return { ...emptyProgress, ...parsed };
  } catch {
    return { ...emptyProgress };
  }
}

export async function saveProgress(progress: UserProgress): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(progress));
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(aISO: string, bISO: string): number {
  const a = new Date(aISO + "T00:00:00Z").getTime();
  const b = new Date(bISO + "T00:00:00Z").getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

/** Updates the streak counter based on today's date vs. the last study date. */
export function withStreakUpdate(progress: UserProgress): UserProgress {
  const today = todayISO();
  if (progress.lastStudyDateISO === today) return progress; // already counted today
  if (!progress.lastStudyDateISO) {
    return { ...progress, streakDays: 1, lastStudyDateISO: today };
  }
  const gap = daysBetween(progress.lastStudyDateISO, today);
  if (gap === 1) {
    return { ...progress, streakDays: progress.streakDays + 1, lastStudyDateISO: today };
  }
  if (gap > 1) {
    return { ...progress, streakDays: 1, lastStudyDateISO: today };
  }
  return progress;
}
