import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { colors, radii, spacing } from "../theme";

export function ComboBadge({ combo }: { combo: number }) {
  const bump = useSharedValue(1);

  useEffect(() => {
    if (combo > 1) {
      bump.value = withSequence(withTiming(1.25, { duration: 120 }), withTiming(1, { duration: 160 }));
    }
  }, [combo, bump]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: bump.value }] }));

  if (combo < 2) return null;

  return (
    <Animated.View style={[styles.wrap, style]}>
      <Text style={styles.text}>🔥 Комбо ×{combo}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: "center",
    backgroundColor: "rgba(255,159,74,0.16)",
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1),
    borderRadius: radii.pill,
    marginBottom: spacing(1.5),
  },
  text: {
    color: colors.streak,
    fontWeight: "800",
    fontSize: 14,
  },
});
