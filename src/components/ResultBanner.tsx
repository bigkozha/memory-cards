import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { PronunciationResult } from "../types";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { colors, radii, spacing } from "../theme";

interface Props {
  result: PronunciationResult;
  transcript: string;
  target: string;
  confidence: number;
}

const COPY: Record<PronunciationResult, { title: string; tone: string }> = {
  correct: { title: "Отлично!", tone: colors.correct },
  close: { title: "Почти!", tone: colors.close },
  incorrect: { title: "Попробуйте ещё раз", tone: colors.incorrect },
};

export function ResultBanner({ result, transcript, target, confidence }: Props) {
  const scale = useSharedValue(0.85);
  const translateY = useSharedValue(16);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
    translateY.value = withTiming(0, { duration: 250 });
  }, [result, scale, translateY]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const { title, tone } = COPY[result];

  return (
    <Animated.View style={[styles.wrap, style, { borderColor: tone }]}>
      <Text style={[styles.title, { color: tone }]}>{title}</Text>
      <Text style={styles.heard}>
        Услышано: <Text style={styles.heardWord}>{transcript || "…"}</Text>
      </Text>
      {result !== "correct" && (
        <Text style={styles.target}>
          Нужно было: <Text style={styles.targetWord}>{target}</Text>
        </Text>
      )}
      <View style={{ height: spacing(1) }} />
      <ConfidenceMeter confidence={confidence} tone={result} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    backgroundColor: colors.cardAlt,
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: spacing(2.5),
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: spacing(1),
  },
  heard: {
    color: colors.textDim,
    fontSize: 14,
  },
  heardWord: {
    color: colors.text,
    fontWeight: "700",
  },
  target: {
    color: colors.textDim,
    fontSize: 14,
    marginTop: 2,
  },
  targetWord: {
    color: colors.text,
    fontWeight: "700",
  },
});
