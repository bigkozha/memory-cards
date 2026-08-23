import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CUSTOM_DECK, CUSTOM_DECK_ID, cardsForDeck, decks } from "../data/seedDecks";
import { colors, radii, spacing } from "../theme";
import { useAppState } from "../context/AppContext";
import { isDue } from "../services/srs";
import { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export function HomeScreen({ navigation }: Props) {
  const { progress, loading } = useAppState();
  const allDecks = [...decks, CUSTOM_DECK];

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>Готовы заговорить по-казахски?</Text>
          <Text style={styles.subGreeting}>Произносите слова вслух и получайте мгновенную обратную связь.</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate("AddCard")} hitSlop={8}>
          <Ionicons name="add" size={26} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>🔥</Text>
          <Text style={styles.statValue}>{progress.streakDays}</Text>
          <Text style={styles.statLabel}>дней подряд</Text>
        </View>
        <View style={styles.statPill}>
          <Text style={styles.statEmoji}>⭐</Text>
          <Text style={styles.statValue}>{progress.xp}</Text>
          <Text style={styles.statLabel}>очков опыта</Text>
        </View>
      </View>

      <FlatList
        data={allDecks}
        keyExtractor={(d) => d.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const cards = cardsForDeck(item.id, progress.customCards);
          const dueCount = loading
            ? cards.length
            : cards.filter((c) => isDue(progress.cardProgress[c.id])).length;
          const isEmptyCustomDeck = item.id === CUSTOM_DECK_ID && cards.length === 0;
          return (
            <Pressable
              onPress={() =>
                isEmptyCustomDeck
                  ? navigation.navigate("AddCard")
                  : navigation.navigate("Study", { deckId: item.id })
              }
            >
              <LinearGradient
                colors={item.color}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.deckCard, isEmptyCustomDeck && styles.deckCardDashed]}
              >
                <Text style={styles.deckEmoji}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.deckTitle}>{item.title}</Text>
                  <Text style={styles.deckDesc}>
                    {isEmptyCustomDeck ? "Нажмите, чтобы добавить первое слово" : item.description}
                  </Text>
                </View>
                {dueCount > 0 && (
                  <View style={styles.dueBadge}>
                    <Text style={styles.dueBadgeText}>{dueCount}</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing(1.5),
    paddingHorizontal: spacing(3),
    paddingTop: spacing(2),
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.text,
  },
  subGreeting: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: spacing(0.5),
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing(1.5),
    paddingHorizontal: spacing(3),
    marginTop: spacing(3),
  },
  statPill: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingVertical: spacing(2),
    alignItems: "center",
  },
  statEmoji: { fontSize: 20 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: "800", marginTop: 2 },
  statLabel: { color: colors.textDim, fontSize: 12 },
  list: {
    padding: spacing(3),
    gap: spacing(2),
  },
  deckCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.lg,
    padding: spacing(2.5),
    marginBottom: spacing(2),
    gap: spacing(2),
  },
  deckCardDashed: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    borderStyle: "dashed",
  },
  deckEmoji: { fontSize: 36 },
  deckTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  deckDesc: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  dueBadge: {
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: radii.pill,
    minWidth: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  dueBadgeText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
