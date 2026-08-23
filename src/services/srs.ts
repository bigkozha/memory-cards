import { CardProgress, PronunciationResult } from "../types";

// Simple 5-box Leitner system. Correct pronunciation promotes a card to the
// next box (longer interval); "close" holds it steady; incorrect demotes it
// back to box 1.
const BOX_INTERVALS_MS = [
  0, // unused, box index starts at 1
  1000 * 60 * 10, // box 1: 10 min
  1000 * 60 * 60 * 6, // box 2: 6 hours
  1000 * 60 * 60 * 24, // box 3: 1 day
  1000 * 60 * 60 * 24 * 3, // box 4: 3 days
  1000 * 60 * 60 * 24 * 7, // box 5: 7 days
];

export const MAX_BOX = BOX_INTERVALS_MS.length - 1;

export function newCardProgress(cardId: string): CardProgress {
  return { cardId, box: 1, dueAt: Date.now(), reps: 0, lapses: 0 };
}

export function applyResult(progress: CardProgress, result: PronunciationResult): CardProgress {
  let box = progress.box;
  let lapses = progress.lapses;

  if (result === "correct") {
    box = Math.min(MAX_BOX, box + 1);
  } else if (result === "incorrect") {
    box = 1;
    lapses += 1;
  } // "close" keeps the same box — another rep needed soon

  const interval = result === "close" ? BOX_INTERVALS_MS[1] : BOX_INTERVALS_MS[box];

  return {
    ...progress,
    box,
    lapses,
    reps: progress.reps + 1,
    dueAt: Date.now() + interval,
    lastResult: result,
  };
}

export function isDue(progress: CardProgress | undefined): boolean {
  if (!progress) return true;
  return progress.dueAt <= Date.now();
}

export function xpForResult(result: PronunciationResult, combo: number): number {
  const base = { correct: 10, close: 4, incorrect: 0 }[result];
  const comboBonus = result === "correct" ? Math.min(combo, 5) * 2 : 0;
  return base + comboBonus;
}
