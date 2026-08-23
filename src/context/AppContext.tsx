import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { CardProgress, PronunciationResult, SessionStats, UserProgress, WordCard } from "../types";
import { emptyProgress, loadProgress, saveProgress, withStreakUpdate } from "../services/storage";
import { applyResult, newCardProgress, xpForResult } from "../services/srs";
import { CUSTOM_DECK_ID } from "../data/seedDecks";

interface AppContextValue {
  progress: UserProgress;
  loading: boolean;
  recordAttempt: (cardId: string, result: PronunciationResult, combo: number) => void;
  finishSession: (stats: Omit<SessionStats, "finishedAt">) => void;
  getCardProgress: (cardId: string) => CardProgress | undefined;
  addCustomCard: (card: Omit<WordCard, "id" | "deckId">) => void;
  updateCustomCard: (cardId: string, updates: Omit<WordCard, "id" | "deckId">) => void;
  removeCustomCard: (cardId: string) => void;
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

  const addCustomCard = useCallback((card: Omit<WordCard, "id" | "deckId">) => {
    setProgress((prev) => {
      const newCard: WordCard = {
        ...card,
        id: `custom-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
        deckId: CUSTOM_DECK_ID,
      };
      return { ...prev, customCards: [...prev.customCards, newCard] };
    });
  }, []);

  const updateCustomCard = useCallback((cardId: string, updates: Omit<WordCard, "id" | "deckId">) => {
    setProgress((prev) => ({
      ...prev,
      customCards: prev.customCards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
    }));
  }, []);

  const removeCustomCard = useCallback((cardId: string) => {
    setProgress((prev) => {
      const { [cardId]: _removed, ...restProgress } = prev.cardProgress;
      return {
        ...prev,
        customCards: prev.customCards.filter((c) => c.id !== cardId),
        cardProgress: restProgress,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      progress,
      loading,
      recordAttempt,
      finishSession,
      getCardProgress,
      addCustomCard,
      updateCustomCard,
      removeCustomCard,
    }),
    [
      progress,
      loading,
      recordAttempt,
      finishSession,
      getCardProgress,
      addCustomCard,
      updateCustomCard,
      removeCustomCard,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppProvider");
  return ctx;
}
