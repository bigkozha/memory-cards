import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { WordCard } from "../types";
import { colors, radii, spacing } from "../theme";

export type PlayState = "idle" | "playing" | "error";

interface Props {
  card: WordCard;
  revealed: boolean;
  onToggleReveal: () => void;
  onPlay: () => void;
  playState: PlayState;
}

export function FlashCard({ card, revealed, onToggleReveal, onPlay, playState }: Props) {
  const flip = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    flip.value = withTiming(revealed ? 1 : 0, { duration: 450 });
  }, [revealed, flip]);

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity: interpolate(flip.value, [0, 0.5, 0.5001, 1], [1, 1, 0, 0]),
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(flip.value, [0, 1], [180, 360], Extrapolation.CLAMP);
    return {
      transform: [{ perspective: 1200 }, { rotateY: `${rotateY}deg` }],
      opacity: interpolate(flip.value, [0, 0.4999, 0.5, 1], [0, 0, 1, 1]),
    };
  });

  return (
    <Pressable onPress={onToggleReveal} style={styles.wrap}>
      <Animated.View style={[styles.face, frontStyle]}>
        <Pressable
          testID="play-button"
          onPress={onPlay}
          disabled={playState === "playing"}
          hitSlop={12}
          style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.7 : 1 }]}
        >
          {playState === "playing" ? (
            <ActivityIndicator color={colors.text} size="small" />
          ) : (
            <Ionicons
              name={playState === "error" ? "volume-mute" : "volume-high"}
              size={20}
              color={colors.text}
            />
          )}
        </Pressable>
        <Text style={styles.emoji}>{card.emoji ?? "🗣️"}</Text>
        <Text style={styles.word}>{card.word}</Text>
        {card.phonetic ? <Text style={styles.phonetic}>{card.phonetic}</Text> : null}
        <Text style={styles.hint}>Нажмите, чтобы увидеть перевод</Text>
      </Animated.View>
      <Animated.View style={[styles.face, styles.faceBack, backStyle]}>
        <Text style={styles.emoji}>{card.emoji ?? "🗣️"}</Text>
        <Text style={styles.translation}>{card.translation}</Text>
        <Text style={styles.hint}>Нажмите, чтобы скрыть</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    aspectRatio: 0.95,
  },
  face: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing(3),
    backfaceVisibility: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  faceBack: {
    backgroundColor: colors.cardAlt,
  },
  playButton: {
    position: "absolute",
    top: spacing(2.5),
    right: spacing(2.5),
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  emoji: {
    fontSize: 56,
    marginBottom: spacing(2),
  },
  word: {
    fontSize: 34,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
  },
  phonetic: {
    marginTop: spacing(1),
    fontSize: 16,
    color: colors.textDim,
  },
  translation: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  hint: {
    position: "absolute",
    bottom: spacing(2.5),
    fontSize: 12,
    color: colors.textDim,
  },
});
