// Core domain types shared across the app.

export type CardId = string;
export type DeckId = string;

export interface WordCard {
  id: CardId;
  deckId: DeckId;
  /** The word/phrase the learner must say out loud. */
  word: string;
  /** Native-language translation or definition shown as the hint/back of the card. */
  translation: string;
  /** IPA or simplified phonetic hint, optional. */
  phonetic?: string;
  /** Locale the ASR should listen for, e.g. "es-ES". */
  locale: string;
  emoji?: string;
}

export interface Deck {
  id: DeckId;
  title: string;
  description: string;
  locale: string;
  color: [string, string]; // gradient pair
  emoji: string;
}

/** Leitner-box style spaced repetition state for a single card. */
export interface CardProgress {
  cardId: CardId;
  box: number; // 1 (new/hard) .. 5 (mastered)
  dueAt: number; // epoch ms
  reps: number;
  lapses: number;
  lastResult?: PronunciationResult;
}

export type PronunciationResult = "correct" | "close" | "incorrect";

export interface AsrResponse {
  transcript: string;
  confidence: number; // 0..1
}

export interface SessionStats {
  deckId: DeckId;
  cardsSeen: number;
  correct: number;
  close: number;
  incorrect: number;
  xpEarned: number;
  bestCombo: number;
  finishedAt: number;
}

export interface UserProgress {
  xp: number;
  streakDays: number;
  lastStudyDateISO?: string;
  cardProgress: Record<CardId, CardProgress>;
  sessions: SessionStats[];
}
