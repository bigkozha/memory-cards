import * as Speech from "expo-speech";
import { createAudioPlayer } from "expo-audio";
import { NCSPEECH_API_KEY } from "../config/env";

export interface TtsProvider {
  /** Speaks `word` aloud in `locale` and resolves once playback finishes. */
  speak(word: string, locale: string): Promise<void>;
}

const NCSPEECH_BASE_URL = "https://studio.ncspeech.ai/v1";

function localeToTtsLanguage(locale: string): "ru" | "kz" {
  // NCSpeech's synthesis endpoint only supports ru/kz — every deck in this
  // app is Kazakh, so anything that isn't explicitly Russian maps to "kz".
  return locale.split("-")[0].toLowerCase() === "ru" ? "ru" : "kz";
}

function bytesToBase64(bytes: Uint8Array): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result += chars[(chunk >> 18) & 63] + chars[(chunk >> 12) & 63] + chars[(chunk >> 6) & 63] + chars[chunk & 63];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    result += chars[(chunk >> 18) & 63] + chars[(chunk >> 12) & 63] + "==";
  } else if (remaining === 2) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result += chars[(chunk >> 18) & 63] + chars[(chunk >> 12) & 63] + chars[(chunk >> 6) & 63] + "=";
  }
  return result;
}

function playDataUri(uri: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const player = createAudioPlayer(uri);
    const subscription = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        subscription.remove();
        player.remove();
        resolve();
      }
    });
    try {
      player.play();
    } catch (err) {
      subscription.remove();
      player.remove();
      reject(err);
    }
  });
}

/**
 * Real provider wired to NCSpeech Studio's synthesis endpoint (POST
 * {base}/v1/audio/speech). Responses are cached per word+locale for the
 * session so replaying a card doesn't re-bill NCSpeech credits every tap.
 */
export class RealNcSpeechTtsProvider implements TtsProvider {
  private cache = new Map<string, string>();

  constructor(private apiKey: string, private baseUrl: string = NCSPEECH_BASE_URL) {}

  async speak(word: string, locale: string): Promise<void> {
    const cacheKey = `${locale}:${word}`;
    let dataUri = this.cache.get(cacheKey);

    if (!dataUri) {
      const body = {
        input: word,
        voice: "asel",
        language: localeToTtsLanguage(locale),
        response_format: "wav" as const,
      };
      console.log(`[tts] POST ${this.baseUrl}/audio/speech — request body:`, body);
      const res = await fetch(`${this.baseUrl}/audio/speech`, {
        method: "POST",
        headers: { "X-API-Key": this.apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log(`[tts] response status: ${res.status}`);
      if (!res.ok) {
        throw new Error(`NCSpeech synthesis failed: ${res.status} ${await res.text()}`);
      }
      const bytes = new Uint8Array(await res.arrayBuffer());
      dataUri = `data:audio/wav;base64,${bytesToBase64(bytes)}`;
      this.cache.set(cacheKey, dataUri);
    } else {
      console.log(`[tts] cache hit — replaying "${word}" without a new API call`);
    }

    await playDataUri(dataUri);
  }
}

/** Offline fallback using the device's built-in speech synthesizer. */
export class DeviceTtsProvider implements TtsProvider {
  speak(word: string, locale: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Speech.speak(word, {
        language: locale,
        onDone: () => resolve(),
        onStopped: () => resolve(),
        onError: (err) => reject(err),
      });
    });
  }
}

/** Picks the real provider once an API key is configured, device TTS otherwise. */
export function getTtsProvider(): TtsProvider {
  if (NCSPEECH_API_KEY) {
    console.log("[tts] EXPO_PUBLIC_NCSPEECH_API_KEY found — using RealNcSpeechTtsProvider");
    return new RealNcSpeechTtsProvider(NCSPEECH_API_KEY);
  }
  console.log("[tts] no API key configured — using DeviceTtsProvider");
  return new DeviceTtsProvider();
}

export const ttsProvider = getTtsProvider();
