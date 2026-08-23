import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CUSTOM_DECK, decks } from "../data/seedDecks";
import { colors, radii, spacing } from "../theme";
import { useAppState } from "../context/AppContext";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Summary">;

export function SummaryScreen({ route, navigation }: Props) {
  const { deckId, stats } = route.params;
  const deck = [...decks, CUSTOM_DECK].find((d) => d.id === deckId)!;
  const { progress } = useAppState();

  const accuracy = stats.cardsSeen > 0 ? Math.round((stats.correct / stats.cardsSeen) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{accuracy >= 70 ? "🎉" : accuracy >= 40 ? "💪" : "🌱"}</Text>
        <Text style={styles.title}>Тренировка завершена!</Text>
        <Text style={styles.deckName}>{deck.title}</Text>

        <View style={styles.statsGrid}>
          <Stat label="Точность" value={`${accuracy}%`} />
          <Stat label="Получено опыта" value={`+${stats.correct * 10 + stats.close * 4}`} />
          <Stat label="Лучшее комбо" value={`×${stats.bestCombo}`} />
          <Stat label="Серия" value={`🔥 ${progress.streakDays} дн.`} />
        </View>

        <View style={styles.breakdown}>
          <BreakdownRow label="Отлично" count={stats.correct} color={colors.correct} />
          <BreakdownRow label="Почти" count={stats.close} color={colors.close} />
          <BreakdownRow label="Не вышло" count={stats.incorrect} color={colors.incorrect} />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Study", { deckId })}
        >
          <Text style={styles.primaryButtonText}>Повторить</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.secondaryButtonText}>К списку тем</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function BreakdownRow({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={styles.breakdownCount}>{count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg, justifyContent: "space-between" },
  content: { alignItems: "center", paddingHorizontal: spacing(3), paddingTop: spacing(6) },
  emoji: { fontSize: 64 },
  title: { fontSize: 26, fontWeight: "800", color: colors.text, marginTop: spacing(1) },
  deckName: { fontSize: 15, color: colors.textDim, marginTop: spacing(0.5) },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing(1.5),
    marginTop: spacing(4),
    width: "100%",
  },
  statBox: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: spacing(2.5),
    alignItems: "center",
  },
  statValue: { fontSize: 24, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 12, color: colors.textDim, marginTop: 2 },
  breakdown: {
    width: "100%",
    marginTop: spacing(3),
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing(2),
    gap: spacing(1.25),
  },
  breakdownRow: { flexDirection: "row", alignItems: "center", gap: spacing(1) },
  dot: { width: 10, height: 10, borderRadius: 5 },
  breakdownLabel: { flex: 1, color: colors.textDim, fontSize: 14 },
  breakdownCount: { color: colors.text, fontWeight: "700", fontSize: 14 },
  footer: { padding: spacing(3), gap: spacing(1.25) },
  primaryButton: {
    backgroundColor: colors.accent,
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    alignItems: "center",
  },
  primaryButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secondaryButton: { paddingVertical: spacing(1.5), alignItems: "center" },
  secondaryButtonText: { color: colors.textDim, fontWeight: "600", fontSize: 14 },
});
