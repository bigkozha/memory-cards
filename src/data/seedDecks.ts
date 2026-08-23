import { Deck, WordCard } from "../types";

// Kazakh vocabulary for Russian-speaking learners. `word` is what the
// learner must say aloud (Kazakh); `translation` is the Russian meaning;
// `phonetic` calls out the Kazakh-specific letters (ә, қ, ң, ғ, ұ, ү, і, h)
// that don't map cleanly onto Russian sounds.
export const decks: Deck[] = [
  {
    id: "kk-greetings",
    title: "Приветствия и вежливость",
    description: "Поздороваться, поблагодарить, попрощаться",
    locale: "kk-KZ",
    color: ["#00AFAA", "#00E0C6"],
    emoji: "🇰🇿",
  },
  {
    id: "kk-family",
    title: "Семья",
    description: "Мама, папа и остальные родные",
    locale: "kk-KZ",
    color: ["#FF6B6B", "#FFA26B"],
    emoji: "👨‍👩‍👧‍👦",
  },
  {
    id: "kk-numbers",
    title: "Числа",
    description: "От одного до десяти",
    locale: "kk-KZ",
    color: ["#6B8BFF", "#6BE0FF"],
    emoji: "🔢",
  },
  {
    id: "kk-food",
    title: "Еда и напитки",
    description: "За столом и на кухне",
    locale: "kk-KZ",
    color: ["#FFC15E", "#FF8B6B"],
    emoji: "🍽️",
  },
  {
    id: "kk-everyday",
    title: "Повседневные слова",
    description: "Дом, город и то, что вокруг",
    locale: "kk-KZ",
    color: ["#B06BFF", "#FF6BD6"],
    emoji: "🏙️",
  },
];

export const words: WordCard[] = [
  // Приветствия и вежливость
  { id: "kk-gr-1", deckId: "kk-greetings", word: "Сәлем", translation: "Привет", phonetic: "сЭ-лем (ә мягче русского «э»)", locale: "kk-KZ", emoji: "👋" },
  { id: "kk-gr-2", deckId: "kk-greetings", word: "Сәлеметсіз бе", translation: "Здравствуйте", phonetic: "сэ-ле-мет-сІз бе", locale: "kk-KZ", emoji: "🙋" },
  { id: "kk-gr-3", deckId: "kk-greetings", word: "Рахмет", translation: "Спасибо", phonetic: "рах-мЕт", locale: "kk-KZ", emoji: "🙏" },
  { id: "kk-gr-4", deckId: "kk-greetings", word: "Кешіріңіз", translation: "Извините", phonetic: "ке-ші-рІ-ңіз (ң — носовое «нг»)", locale: "kk-KZ", emoji: "🙇" },
  { id: "kk-gr-5", deckId: "kk-greetings", word: "Иә", translation: "Да", phonetic: "и-Йэ", locale: "kk-KZ", emoji: "✅" },
  { id: "kk-gr-6", deckId: "kk-greetings", word: "Жоқ", translation: "Нет", phonetic: "жОқ (қ — глубже русского «к»)", locale: "kk-KZ", emoji: "🚫" },
  { id: "kk-gr-7", deckId: "kk-greetings", word: "Сау болыңыз", translation: "До свидания", phonetic: "сАу бо-лы-ңыз", locale: "kk-KZ", emoji: "👋" },
  { id: "kk-gr-8", deckId: "kk-greetings", word: "Қалайсыз?", translation: "Как дела?", phonetic: "қа-лАй-сыз", locale: "kk-KZ", emoji: "❓" },

  // Семья
  { id: "kk-fam-1", deckId: "kk-family", word: "Ана", translation: "Мама", phonetic: "а-нА", locale: "kk-KZ", emoji: "👩" },
  { id: "kk-fam-2", deckId: "kk-family", word: "Әке", translation: "Папа", phonetic: "Э-ке", locale: "kk-KZ", emoji: "👨" },
  { id: "kk-fam-3", deckId: "kk-family", word: "Ата", translation: "Дедушка", phonetic: "а-тА", locale: "kk-KZ", emoji: "👴" },
  { id: "kk-fam-4", deckId: "kk-family", word: "Әже", translation: "Бабушка", phonetic: "Э-же", locale: "kk-KZ", emoji: "👵" },
  { id: "kk-fam-5", deckId: "kk-family", word: "Аға", translation: "Старший брат", phonetic: "а-ғА (ғ — картавое «г»)", locale: "kk-KZ", emoji: "🧑" },
  { id: "kk-fam-6", deckId: "kk-family", word: "Іні", translation: "Младший брат", phonetic: "І-ні", locale: "kk-KZ", emoji: "🧒" },
  { id: "kk-fam-7", deckId: "kk-family", word: "Отбасы", translation: "Семья", phonetic: "от-ба-сЫ", locale: "kk-KZ", emoji: "🏡" },
  { id: "kk-fam-8", deckId: "kk-family", word: "Бала", translation: "Ребёнок", phonetic: "ба-лА", locale: "kk-KZ", emoji: "🧸" },

  // Числа
  { id: "kk-num-1", deckId: "kk-numbers", word: "Бір", translation: "Один", phonetic: "бІр", locale: "kk-KZ", emoji: "1️⃣" },
  { id: "kk-num-2", deckId: "kk-numbers", word: "Екі", translation: "Два", phonetic: "е-кІ", locale: "kk-KZ", emoji: "2️⃣" },
  { id: "kk-num-3", deckId: "kk-numbers", word: "Үш", translation: "Три", phonetic: "Үш (ү — губы трубочкой, как нем. ü)", locale: "kk-KZ", emoji: "3️⃣" },
  { id: "kk-num-4", deckId: "kk-numbers", word: "Төрт", translation: "Четыре", phonetic: "тӨрт", locale: "kk-KZ", emoji: "4️⃣" },
  { id: "kk-num-5", deckId: "kk-numbers", word: "Бес", translation: "Пять", phonetic: "бЕс", locale: "kk-KZ", emoji: "5️⃣" },
  { id: "kk-num-6", deckId: "kk-numbers", word: "Алты", translation: "Шесть", phonetic: "ал-тЫ", locale: "kk-KZ", emoji: "6️⃣" },
  { id: "kk-num-7", deckId: "kk-numbers", word: "Жеті", translation: "Семь", phonetic: "же-тІ", locale: "kk-KZ", emoji: "7️⃣" },
  { id: "kk-num-8", deckId: "kk-numbers", word: "Сегіз", translation: "Восемь", phonetic: "се-гІз", locale: "kk-KZ", emoji: "8️⃣" },
  { id: "kk-num-9", deckId: "kk-numbers", word: "Тоғыз", translation: "Девять", phonetic: "то-ғЫз (ғ — картавое «г»)", locale: "kk-KZ", emoji: "9️⃣" },
  { id: "kk-num-10", deckId: "kk-numbers", word: "Он", translation: "Десять", phonetic: "Он", locale: "kk-KZ", emoji: "🔟" },

  // Еда и напитки
  { id: "kk-food-1", deckId: "kk-food", word: "Су", translation: "Вода", phonetic: "сУ", locale: "kk-KZ", emoji: "💧" },
  { id: "kk-food-2", deckId: "kk-food", word: "Нан", translation: "Хлеб", phonetic: "нАн", locale: "kk-KZ", emoji: "🍞" },
  { id: "kk-food-3", deckId: "kk-food", word: "Ет", translation: "Мясо", phonetic: "Ет", locale: "kk-KZ", emoji: "🍖" },
  { id: "kk-food-4", deckId: "kk-food", word: "Сүт", translation: "Молоко", phonetic: "сҮт", locale: "kk-KZ", emoji: "🥛" },
  { id: "kk-food-5", deckId: "kk-food", word: "Шай", translation: "Чай", phonetic: "шАй", locale: "kk-KZ", emoji: "🍵" },
  { id: "kk-food-6", deckId: "kk-food", word: "Қант", translation: "Сахар", phonetic: "қАнт (қ — глубже русского «к»)", locale: "kk-KZ", emoji: "🍬" },
  { id: "kk-food-7", deckId: "kk-food", word: "Алма", translation: "Яблоко", phonetic: "ал-мА", locale: "kk-KZ", emoji: "🍎" },
  { id: "kk-food-8", deckId: "kk-food", word: "Қымыз", translation: "Кумыс", phonetic: "қы-мЫз (қ — глубже русского «к»)", locale: "kk-KZ", emoji: "🥤" },

  // Повседневные слова
  { id: "kk-ev-1", deckId: "kk-everyday", word: "Үй", translation: "Дом", phonetic: "Үй (ү — губы трубочкой)", locale: "kk-KZ", emoji: "🏠" },
  { id: "kk-ev-2", deckId: "kk-everyday", word: "Кітап", translation: "Книга", phonetic: "кі-тАп", locale: "kk-KZ", emoji: "📖" },
  { id: "kk-ev-3", deckId: "kk-everyday", word: "Дос", translation: "Друг", phonetic: "дОс", locale: "kk-KZ", emoji: "🤝" },
  { id: "kk-ev-4", deckId: "kk-everyday", word: "Мектеп", translation: "Школа", phonetic: "мек-тЕп", locale: "kk-KZ", emoji: "🏫" },
  { id: "kk-ev-5", deckId: "kk-everyday", word: "Күн", translation: "Солнце / день", phonetic: "кҮн (ү — губы трубочкой)", locale: "kk-KZ", emoji: "☀️" },
  { id: "kk-ev-6", deckId: "kk-everyday", word: "Түн", translation: "Ночь", phonetic: "тҮн (ү — губы трубочкой)", locale: "kk-KZ", emoji: "🌙" },
  { id: "kk-ev-7", deckId: "kk-everyday", word: "Жол", translation: "Дорога", phonetic: "жОл", locale: "kk-KZ", emoji: "🛣️" },
  { id: "kk-ev-8", deckId: "kk-everyday", word: "Қала", translation: "Город", phonetic: "қа-лА (қ — глубже русского «к»)", locale: "kk-KZ", emoji: "🏙️" },
];

export function wordsForDeck(deckId: string): WordCard[] {
  return words.filter((w) => w.deckId === deckId);
}

export const CUSTOM_DECK_ID = "custom";

export const CUSTOM_DECK: Deck = {
  id: CUSTOM_DECK_ID,
  title: "Мои карточки",
  description: "Слова, которые вы добавили сами",
  locale: "kk-KZ",
  color: ["#3E8E7E", "#7FD8BE"],
  emoji: "✏️",
};

/** Like wordsForDeck, but also resolves the user's own custom deck. */
export function cardsForDeck(deckId: string, customCards: WordCard[]): WordCard[] {
  return deckId === CUSTOM_DECK_ID ? customCards : wordsForDeck(deckId);
}
