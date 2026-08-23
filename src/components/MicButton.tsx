import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, radii } from "../theme";
import { RecorderPhase } from "../hooks/useVoiceRecorder";

interface Props {
  phase: RecorderPhase;
  onPress: () => void;
  disabled?: boolean;
}

const SIZE = 92;

export function MicButton({ phase, onPress, disabled }: Props) {
  const pulse = useSharedValue(1);
  const spin = useSharedValue(0);

  useEffect(() => {
    if (phase === "recording") {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 550, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 550, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1, { duration: 200 });
    }
  }, [phase, pulse]);

  useEffect(() => {
    if (phase === "processing") {
      spin.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.linear }), -1, false);
    } else {
      cancelAnimation(spin);
      spin.value = 0;
    }
  }, [phase, spin]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: phase === "recording" ? 0.35 : 0,
  }));

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));

  const backgroundColor =
    phase === "recording" ? colors.incorrect : phase === "processing" ? colors.cardAlt : colors.accent;

  const icon = phase === "processing" ? "sync" : phase === "recording" ? "square" : "mic";

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.ring, ringStyle, { backgroundColor }]} />
      <Pressable
        testID="mic-button"
        onPress={onPress}
        disabled={disabled || phase === "processing"}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Animated.View style={phase === "processing" ? spinStyle : undefined}>
          <Ionicons name={icon as any} size={34} color={colors.text} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE + 40,
    height: SIZE + 40,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: radii.pill,
  },
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.pill,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
});
