App Review Information — Notes field response (Guideline 2.1)

---

**1. Screen recording**
[Link to screen recording — see instructions above. Must be captured on the physical device listed below, showing: launch → home screen → opening a deck → viewing a card → tapping the speaker icon to hear pronunciation → tapping the microphone, saying the word, and seeing the pronunciation result → optionally, adding a custom card.]

**2. Devices tested**
[Fill in: e.g. "iPhone 15, iOS 18.1" — the exact device and OS version from Settings → General → About after installing via TestFlight.]

**3. App description and target audience**
Сөйле ("Speak" in Kazakh) is a pronunciation-practice app for Russian-speaking users learning to speak Kazakh — primarily aimed at residents of Kazakhstan who understand Kazakh vocabulary but want to build confidence actually speaking it aloud. The problem it solves: most vocabulary apps only test recognition (matching a word to its meaning), not production (actually saying the word correctly). Сөйле has the user speak each word into the microphone and uses speech recognition to give instant feedback on whether the pronunciation matched, closing the gap between passive and active language learning.

**4. Setup and accessing main features**
No account, login, or registration of any kind is required. The app is immediately usable after install:
- The home screen lists vocabulary decks (Greetings, Family, Numbers, Food, Everyday words, plus a user-editable "My Cards" deck).
- Tapping a deck starts a study session showing one word card at a time.
- Tapping the speaker icon plays a reference pronunciation of the word.
- Tapping the microphone records the user saying the word, then shows whether it was correct.
- The "+" button on the home screen opens a form to add custom vocabulary cards.
No credentials or sample files are needed to access any feature.

**5. External services used**
- **NCSpeech Studio** (studio.ncspeech.ai) — third-party speech recognition (ASR) and text-to-speech (TTS) API, used to transcribe the user's spoken attempt and to synthesize reference pronunciations.
- A backend proxy the developer operates on **Cloudflare Workers**, which forwards requests to NCSpeech Studio without the client ever holding the third-party API key. No user data is stored on this proxy — it only relays requests and responses.
- No authentication service, payment processor, or advertising SDK is used anywhere in the app.

**6. Regional differences**
The app functions identically in all regions and territories — there is no region-gated content or functionality. The subject matter (Kazakh-language vocabulary) is most relevant to users in Kazakhstan, but nothing in the app restricts access by region.

**7. Regulated industry / protected third-party material**
Not applicable. The app does not operate in a regulated industry (no health, finance, or legal content) and does not include any copyrighted or protected third-party material — all vocabulary content is original.
