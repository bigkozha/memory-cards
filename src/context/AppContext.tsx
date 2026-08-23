import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { CardProgress, PronunciationResult, SessionStats, UserProgress } from "../types";
import { emptyProgress, loadProgress, saveProgress, withStreakUpdate } from "../services/storage";
import { applyResult, newCardProgress, xpForResult } from "../services/srs";

interface AppContextValue {
  progress: UserProgress;
  loading: boolean;
  recordAttempt: (cardId: string, result: PronunciationResult, combo: number) => void;
  finishSession: (stats: Omit<SessionStats, "finishedAt">) => void;
  getCardProgress: (cardId: string) => CardProgress | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<UserProgress>(emptyProgress);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress().then((p) => {
      setProgress(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) saveProgress(progress);
  }, [progress, loading]);

  const recordAttempt = useCallback((cardId: string, result: PronunciationResult, combo: number) => {
    setProgress((prev) => {
      const existing = prev.cardProgress[cardId] ?? newCardProgress(cardId);
      const updated = applyResult(existing, result);
      const xp = xpForResult(result, combo);
      return {
        ...prev,
        xp: prev.xp + xp,
        cardProgress: { ...prev.cardProgress, [cardId]: updated },
      };
    });
  }, []);

  const finishSession = useCallback((stats: Omit<SessionStats, "finishedAt">) => {
    setProgress((prev) => {
      const withStreak = withStreakUpdate(prev);
      return {
        ...withStreak,
        sessions: [...withStreak.sessions, { ...stats, finishedAt: Date.now() }],
      };
    });
  }, []);

  const getCardProgress = useCallback(
    (cardId: string) => progress.cardProgress[cardId],
    [progress.cardProgress]
  );

  const value = useMemo(
    () => ({ progress, loading, recordAttempt, finishSession, getCardProgress }),
    [progress, loading, recordAttempt, finishSession, getCardProgress]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
