import { Platform } from "react-native";
import { createAudioPlayer } from "expo-audio";
import { AsrResponse } from "../types";
import { PROXY_BASE_URL } from "../config/env";
import { transcodeToWavBlob } from "../utils/webAudioTranscode";

/**
 * TEMP DEBUG: plays back the exact clip about to be uploaded, so we can hear
 * what NCSpeech hears instead of guessing from stats. Remove once the web
 * mic-quality issue (github.com/bigkozha/memory-cards — silence/garbage
 * transcripts on iPhone Safari) is confirmed fixed.
 */
async function debugPlaybackWeb(blob: Blob): Promise<void> {
  const url = URL.createObjectURL(blob);
  console.log("[asr-proxy] DEBUG: playing back the clip about to be sent…");
  await new Promise<void>((resolve) => {
    const player = createAudioPlayer(url);
    const sub = player.addListener("playbackStatusUpdate", (status) => {
      if (status.didJustFinish) {
        sub.remove();
        player.remove();
        URL.revokeObjectURL(url);
        resolve();
      }
    });
    player.play();
  });
}

/**
 * Request shape matches NCSpeech Studio's real transcription endpoint
 * (POST {base}/v1/audio/transcriptions, multipart/form-data) so swapping
 * MockAsrProvider for RealProxyAsrProvider below is a like-for-like change.
 * Source: NCSpeech Studio user instructions, ed. 08.2026 (studio.ncspeech.ai).
 */
export interface AsrRequest {
  audioUri: string;
  /** BCP-47ish locale, e.g. "es-ES". Sent as `language`; NCSpeech accepts it unset to auto-detect. */
  locale: string;
  /**
   * Words to bias recognition toward — NCSpeech's "boost" field. We pass the
   * card's target word here since we know exactly what the learner is
   * attempting, same as boosting names/brands/terms per the docs.
   */
  boost?: string[];
  /**
   * DEV-ONLY. A real ASR provider has no notion of "expected text" — it just
   * transcribes. RealNcSpeechProvider ignores this field entirely;
   * MockAsrProvider uses it to fabricate a plausible response without a
   * backend. Delete once the mock is retired.
   */
  mockExpectedText?: string;
}

export interface AsrProvider {
  transcribe(request: AsrRequest): Promise<AsrResponse>;
}

/**
 * Real provider wired to our own proxy Worker (see /server), which injects
 * the real NCSpeech API key server-side — the app never holds it. Not used
 * by default — see getAsrProvider() below — because this app ships without
 * a proxy URL configured. Once EXPO_PUBLIC_PROXY_BASE_URL is set, the app
 * switches to this provider automatically without any other code changes.
 * See https://github.com/bigkozha/memory-cards/issues/1 for why this exists
 * instead of calling studio.ncspeech.ai directly with an embedded key.
 *
 * Response mapping matches NCSpeech's `verbose_json` as confirmed against a
 * live call: { text, segments: [{ words: [{ word, confidence, ... }] }] }.
 * Still worth spot-checking against the account's API tab occasionally — the
 * docs explicitly warn the copy on paper can go stale.
 */
export class RealProxyAsrProvider implements AsrProvider {
  constructor(private baseUrl: string) {}

  async transcribe(request: AsrRequest): Promise<AsrResponse> {
    // Expo SDK 57's fetch/FormData (a WinterCG implementation, not RN's old
    // fetch) dropped support for the classic RN `{ uri, name, type }` file
    // part — it requires a real Blob. Read the local recording into one first.
    let fileBlob = await (await fetch(request.audioUri)).blob();

    // NCSpeech's ASR reliably handles WAV/PCM but 500s on compressed
    // containers — confirmed for both AAC (native) and WebM (web). Native
    // recording already produces WAV directly; browsers can only record
    // compressed formats via MediaRecorder, so decode + re-encode here.
    if (Platform.OS === "web" && !fileBlob.type.includes("wav")) {
      console.log(`[asr-proxy] transcoding ${fileBlob.type} to WAV for web…`);
      fileBlob = await transcodeToWavBlob(fileBlob);
      await debugPlaybackWeb(fileBlob);
    }

    // The server appears to sniff the container from the filename extension
    // (a WAV recording sent as "attempt.m4a" previously triggered a 500), so
    // keep the real extension. Native recordings have a real file:// path
    // with an extension; web recordings are blob: URLs with no path
    // extension at all, so fall back to the Blob's own MIME type there.
    const extension = extensionFromUri(request.audioUri, fileBlob.type);

    const form = new FormData();
    form.append("file", fileBlob, `attempt.${extension}`);
    if (request.locale) form.append("language", localeToLanguageCode(request.locale));
    if (request.boost?.length) form.append("boost", request.boost.join(","));
    form.append("response_format", "verbose_json");

    console.log(`[asr-proxy] POST ${this.baseUrl}/audio/transcriptions`, {
      audioUri: request.audioUri,
      blobType: fileBlob.type,
      filename: `attempt.${extension}`,
      language: request.locale ? localeToLanguageCode(request.locale) : undefined,
      boost: request.boost,
    });

    const res = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      body: form,
    });

    console.log(`[asr-proxy] response status: ${res.status}`);

    if (!res.ok) {
      throw new Error(`Transcription proxy failed: ${res.status} ${await res.text()}`);
    }

    const json = await res.json();
    const transcript: string = json.text ?? "";
    const confidence = confidenceFromSegments(json.segments);
    return { transcript, confidence };
  }
}

function localeToLanguageCode(locale: string): string {
  const base = locale.split("-")[0].toLowerCase();
  // NCSpeech's own docs use "kz" (not the ISO 639-1 "kk") for Kazakh.
  return base === "kk" ? "kz" : base;
}

const MIME_TO_EXTENSION: Record<string, string> = {
  "audio/webm": "webm",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/aac": "aac",
  "audio/ogg": "ogg",
  "audio/mpeg": "mp3",
};

function extensionFromUri(uri: string, mimeType: string): string {
  const lastSegment = uri.split("/").pop() ?? "";
  const dotIndex = lastSegment.lastIndexOf(".");
  if (dotIndex > 0) return lastSegment.slice(dotIndex + 1);
  const base = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  return MIME_TO_EXTENSION[base] ?? "m4a";
}

/**
 * NCSpeech's actual verbose_json shape (confirmed against a live response):
 * { text, segments: [{ words: [{ word, confidence, ... }] }] }
 * `confidence` is already 0..1 per word — average them across the response.
 */
function confidenceFromSegments(segments: unknown): number {
  if (!Array.isArray(segments) || segments.length === 0) return 0.85;
  const confidences = segments
    .flatMap((s) => (Array.isArray((s as any)?.words) ? (s as any).words : []))
    .map((w) => (typeof w?.confidence === "number" ? w.confidence : null))
    .filter((v): v is number => v !== null);
  if (confidences.length === 0) return 0.85;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

const LATENCY_MS = 900;

function normalize(s: string): string {
  return s.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Randomly perturb a word to simulate a mis-hearing ASR engine. */
function mangle(word: string): string {
  const chars = word.split("");
  if (chars.length < 2) return word + "h";
  const strategies = [
    () => chars.filter((_, i) => i !== Math.floor(Math.random() * chars.length)).join(""), // drop a char
    () => {
      const i = Math.floor(Math.random() * chars.length);
      chars[i] = "aeiou"[Math.floor(Math.random() * 5)];
      return chars.join("");
    }, // swap a vowel
    () => chars.join("") + "s", // trailing sound
  ];
  const pick = strategies[Math.floor(Math.random() * strategies.length)];
  return pick();
}

export class MockAsrProvider implements AsrProvider {
  async transcribe(request: AsrRequest): Promise<AsrResponse> {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

    const expectedText = request.mockExpectedText;
    if (!expectedText) {
      // No hint available (shouldn't happen in this app) — return low-confidence noise.
      return { transcript: "", confidence: 0.1 };
    }

    const roll = Math.random();
    if (roll < 0.72) {
      // Heard it correctly.
      return { transcript: expectedText, confidence: 0.85 + Math.random() * 0.15 };
    }
    if (roll < 0.9) {
      // Close but slightly off — still readable as an attempt.
      return { transcript: mangle(expectedText), confidence: 0.55 + Math.random() * 0.2 };
    }
    // Mis-hearing.
    return { transcript: mangle(mangle(expectedText)), confidence: 0.2 + Math.random() * 0.3 };
  }
}

/** Picks the real provider once a proxy URL is configured, mock otherwise. */
export function getAsrProvider(): AsrProvider {
  if (PROXY_BASE_URL) {
    console.log("[asr] EXPO_PUBLIC_PROXY_BASE_URL found — using RealProxyAsrProvider");
    return new RealProxyAsrProvider(PROXY_BASE_URL);
  }
  console.log("[asr] no proxy URL configured — using MockAsrProvider");
  return new MockAsrProvider();
}

export const asrProvider = getAsrProvider();

/** Compares an ASR transcript to the target word and classifies the attempt. */
export function scoreAttempt(
  transcript: string,
  target: string
): { result: "correct" | "close" | "incorrect"; distance: number } {
  const a = normalize(transcript);
  const b = normalize(target);
  const distance = levenshtein(a, b);
  if (a === b) return { result: "correct", distance };
  const threshold = Math.max(1, Math.floor(b.length * 0.34));
  if (distance <= threshold) return { result: "close", distance };
  return { result: "incorrect", distance };
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
