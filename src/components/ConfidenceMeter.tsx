import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { colors, radii } from "../theme";

interface Props {
  confidence: number; // 0..1
  tone: "correct" | "close" | "incorrect";
}

export function ConfidenceMeter({ confidence, tone }: Props) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(confidence, { duration: 700 });
  }, [confidence, width]);

  const style = useAnimatedStyle(() => ({
    width: `${Math.max(4, width.value * 100)}%`,
  }));

  const color = { correct: colors.correct, close: colors.close, incorrect: colors.incorrect }[tone];

  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, style, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 10,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: radii.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.pill,
  },
});
