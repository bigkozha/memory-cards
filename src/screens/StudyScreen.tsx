import React, { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { cardsForDeck } from "../data/seedDecks";
import { colors, radii, spacing } from "../theme";
import { FlashCard, PlayState } from "../components/FlashCard";
import { MicButton } from "../components/MicButton";
import { ResultBanner } from "../components/ResultBanner";
import { ComboBadge } from "../components/ComboBadge";
import { MicPermissionDeniedError, useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { asrProvider, scoreAttempt } from "../services/asrService";
import { ttsProvider } from "../services/ttsService";
import { AsrResponse, PronunciationResult } from "../types";
import { useAppState } from "../context/AppContext";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Study">;

interface Attempt {
  response: AsrResponse;
  result: PronunciationResult;
}

export function StudyScreen({ route, navigation }: Props) {
  const { deckId } = route.params;
  const { progress, recordAttempt, finishSession } = useAppState();
  const cards = useMemo(() => {
    const list = cardsForDeck(deckId, progress.customCards);
    // Shuffle so repeat sessions don't feel identical.
    return [...list].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const recorder = useVoiceRecorder();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [combo, setCombo] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [playState, setPlayState] = useState<PlayState>("idle");
  const statsRef = useRef({ correct: 0, close: 0, incorrect: 0, xpEarned: 0, bestCombo: 0 });

  const card = cards[index];
  const isLast = index === cards.length - 1;

  async function handlePlayPress() {
    if (playState === "playing") return;
    console.log(`[tts] play pressed for word: "${card.word}" (${card.locale})`);
    setPlayState("playing");
    try {
      await ttsProvider.speak(card.word, card.locale);
      setPlayState("idle");
    } catch (err) {
      console.log("[tts] speak() failed:", err);
      setPlayState("error");
    }
  }

  async function handleMicPress() {
    if (recorder.phase === "idle") {
      setAttempt(null);
      setMicError(null);
      console.log("[mic] requesting permission + starting recording…");
      try {
        await recorder.start();
        console.log("[mic] recording started");
      } catch (err) {
        console.log("[mic] start() failed:", err);
        setMicError(
          err instanceof MicPermissionDeniedError
            ? "Нет доступа к микрофону. Разрешите доступ в настройках устройства и попробуйте снова."
            : "Не удалось начать запись. Попробуйте ещё раз."
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }
    if (recorder.phase === "recording") {
      let uri: string | null;
      try {
        uri = await recorder.stop();
        console.log("[mic] recording stopped, uri:", uri);
      } catch (err) {
        console.log("[mic] stop() failed:", err);
        recorder.reset();
        setMicError("Не удалось завершить запись. Попробуйте ещё раз.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      if (!uri) {
        console.log("[mic] no audio file produced, aborting before ASR call");
        recorder.reset();
        setMicError("Не удалось получить запись. Попробуйте ещё раз.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      let response;
      try {
        console.log("[asr] calling transcribe()", { locale: card.locale, word: card.word });
        response = await asrProvider.transcribe({
          audioUri: uri,
          locale: card.locale,
          boost: [card.word],
          mockExpectedText: card.word,
        });
        console.log("[asr] response:", response);
      } catch (err) {
        console.log("[asr] transcribe() failed:", err);
        recorder.reset();
        setMicError(
          "Не удалось связаться с сервером распознавания. Проверьте соединение и попробуйте ещё раз."
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }

      const { result } = scoreAttempt(response.transcript, card.word);
      setAttempt({ response, result });
      recorder.reset();

      const nextCombo = result === "correct" ? combo + 1 : 0;
      setCombo(nextCombo);
      statsRef.current.bestCombo = Math.max(statsRef.current.bestCombo, nextCombo);
      statsRef.current[result] += 1;

      recordAttempt(card.id, result, combo);

      if (result === "correct") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (result === "close") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }

  function handleNext() {
    if (isLast) {
      finishSession({
        deckId,
        cardsSeen: cards.length,
        correct: statsRef.current.correct,
        close: statsRef.current.close,
        incorrect: statsRef.current.incorrect,
        xpEarned: statsRef.current.correct * 10 + statsRef.current.close * 4,
        bestCombo: statsRef.current.bestCombo,
      });
      navigation.replace("Summary", {
        deckId,
        stats: { ...statsRef.current, cardsSeen: cards.length },
      });
      return;
    }
    setAttempt(null);
    setMicError(null);
    setRevealed(false);
    setPlayState("idle");
    setIndex((i) => i + 1);
  }

  if (!card) {
    return (
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.emptyDeck}>
          <Text style={styles.emptyDeckText}>В этой колоде пока нет карточек.</Text>
          <Pressable style={styles.nextButton} onPress={() => navigation.goBack()}>
            <Text style={styles.nextButtonText}>Назад</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${((index + 1) / cards.length) * 100}%` }]} />
        </View>
        <Text style={styles.progressLabel}>
          {index + 1}/{cards.length}
        </Text>
      </View>

      <View style={styles.body}>
        <ComboBadge combo={combo} />
        <FlashCard
          card={card}
          revealed={revealed}
          onToggleReveal={() => setRevealed((r) => !r)}
          onPlay={handlePlayPress}
          playState={playState}
        />

        <View style={styles.resultSlot}>
          {attempt && (
            <ResultBanner
              result={attempt.result}
              transcript={attempt.response.transcript}
              target={card.word}
              confidence={attempt.response.confidence}
            />
          )}
          {micError && !attempt && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{micError}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.footer}>
        {attempt ? (
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>{isLast ? "Завершить тренировку" : "Следующее слово"}</Text>
          </Pressable>
        ) : (
          <>
            <Text style={styles.instruction}>
              {recorder.phase === "recording"
                ? "Слушаю… нажмите, чтобы остановить"
                : recorder.phase === "processing"
                ? "Проверяю произношение…"
                : `Произнесите «${card.word}» вслух`}
            </Text>
            <MicButton phase={recorder.phase} onPress={handleMicPress} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing(3),
    gap: spacing(1.5),
  },
  close: { color: colors.textDim, fontSize: 20, fontWeight: "700" },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  progressLabel: { color: colors.textDim, fontSize: 12, minWidth: 36, textAlign: "right" },
  body: {
    flex: 1,
    paddingHorizontal: spacing(3),
    paddingTop: spacing(3),
    justifyContent: "center",
  },
  resultSlot: {
    marginTop: spacing(3),
    minHeight: 130,
    justifyContent: "flex-start",
  },
  errorBanner: {
    width: "100%",
    backgroundColor: "rgba(255,107,107,0.12)",
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.incorrect,
    padding: spacing(2.5),
  },
  errorText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(2),
    paddingTop: spacing(1),
    gap: spacing(1.5),
  },
  instruction: {
    color: colors.textDim,
    fontSize: 14,
    textAlign: "center",
  },
  nextButton: {
    width: "100%",
    backgroundColor: colors.accent,
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    alignItems: "center",
  },
  nextButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  emptyDeck: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing(4),
    gap: spacing(2),
  },
  emptyDeckText: { color: colors.textDim, fontSize: 15, textAlign: "center" },
});
