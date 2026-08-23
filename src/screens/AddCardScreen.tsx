import React, { useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootNavigator";
import { useAppState } from "../context/AppContext";
import { colors, radii, spacing } from "../theme";
import { WordCard } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "AddCard">;

const DEFAULT_EMOJI = "🗣️";

export function AddCardScreen({ navigation }: Props) {
  const { progress, addCustomCard, updateCustomCard, removeCustomCard } = useAppState();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [word, setWord] = useState("");
  const [translation, setTranslation] = useState("");
  const [phonetic, setPhonetic] = useState("");
  const [emoji, setEmoji] = useState("");

  const canSave = word.trim().length > 0 && translation.trim().length > 0;

  function resetForm() {
    setEditingId(null);
    setWord("");
    setTranslation("");
    setPhonetic("");
    setEmoji("");
  }

  function handleSave() {
    if (!canSave) return;
    const values = {
      word: word.trim(),
      translation: translation.trim(),
      phonetic: phonetic.trim() || undefined,
      emoji: emoji.trim() || DEFAULT_EMOJI,
      locale: "kk-KZ",
    };
    if (editingId) {
      updateCustomCard(editingId, values);
    } else {
      addCustomCard(values);
    }
    resetForm();
  }

  function handleStartEdit(card: WordCard) {
    setEditingId(card.id);
    setWord(card.word);
    setTranslation(card.translation);
    setPhonetic(card.phonetic ?? "");
    setEmoji(card.emoji ?? "");
  }

  function handleDelete(cardId: string) {
    if (editingId === cardId) resetForm();
    removeCustomCard(cardId);
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{editingId ? "Изменить карточку" : "Новая карточка"}</Text>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.close}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Field label="Слово на казахском *">
            <TextInput
              style={styles.input}
              value={word}
              onChangeText={setWord}
              placeholder="Мысалы: Сәлем"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
            />
          </Field>
          <Field label="Перевод на русский *">
            <TextInput
              style={styles.input}
              value={translation}
              onChangeText={setTranslation}
              placeholder="Например: Привет"
              placeholderTextColor={colors.textDim}
            />
          </Field>
          <Field label="Подсказка по произношению">
            <TextInput
              style={styles.input}
              value={phonetic}
              onChangeText={setPhonetic}
              placeholder="Необязательно"
              placeholderTextColor={colors.textDim}
            />
          </Field>
          <Field label="Эмодзи">
            <TextInput
              style={styles.input}
              value={emoji}
              onChangeText={setEmoji}
              placeholder={DEFAULT_EMOJI}
              placeholderTextColor={colors.textDim}
            />
          </Field>

          <View style={styles.saveRow}>
            <Pressable
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={!canSave}
            >
              <Text style={styles.saveButtonText}>
                {editingId ? "Сохранить изменения" : "Добавить карточку"}
              </Text>
            </Pressable>
            {editingId && (
              <Pressable style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.cancelButtonText}>Отмена</Text>
              </Pressable>
            )}
          </View>
        </View>

        <Text style={styles.listTitle}>
          Ваши карточки {progress.customCards.length > 0 ? `(${progress.customCards.length})` : ""}
        </Text>
        <FlatList
          data={progress.customCards}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>Пока пусто — добавьте первое слово выше.</Text>}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.row, editingId === item.id && styles.rowEditing]}
              onPress={() => handleStartEdit(item)}
            >
              <Text style={styles.rowEmoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowWord}>{item.word}</Text>
                <Text style={styles.rowTranslation}>{item.translation}</Text>
              </View>
              <Ionicons name="pencil-outline" size={18} color={colors.textDim} />
              <Pressable onPress={() => handleDelete(item.id)} hitSlop={12}>
                <Ionicons name="trash-outline" size={20} color={colors.incorrect} />
              </Pressable>
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing(3),
    paddingTop: spacing(1),
  },
  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  close: { color: colors.textDim, fontSize: 20, fontWeight: "700" },
  form: {
    paddingHorizontal: spacing(3),
    paddingTop: spacing(2),
    gap: spacing(1.5),
  },
  field: { gap: spacing(0.75) },
  fieldLabel: { color: colors.textDim, fontSize: 13 },
  input: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    paddingHorizontal: spacing(2),
    paddingVertical: spacing(1.5),
    color: colors.text,
    fontSize: 16,
  },
  saveRow: {
    marginTop: spacing(1),
    flexDirection: "row",
    gap: spacing(1.5),
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: spacing(2),
    borderRadius: radii.md,
    alignItems: "center",
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cancelButton: {
    paddingVertical: spacing(2),
    paddingHorizontal: spacing(2),
  },
  cancelButtonText: { color: colors.textDim, fontWeight: "700", fontSize: 15 },
  listTitle: {
    color: colors.textDim,
    fontSize: 13,
    paddingHorizontal: spacing(3),
    marginTop: spacing(3),
    marginBottom: spacing(1),
  },
  list: {
    paddingHorizontal: spacing(3),
    paddingBottom: spacing(3),
    gap: spacing(1),
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 14,
    paddingVertical: spacing(2),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing(1.5),
    gap: spacing(1.5),
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  rowEditing: {
    borderColor: colors.accent,
  },
  rowEmoji: { fontSize: 24 },
  rowWord: { color: colors.text, fontWeight: "700", fontSize: 15 },
  rowTranslation: { color: colors.textDim, fontSize: 13 },
});
