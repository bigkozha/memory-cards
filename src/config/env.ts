// Base URL of the NCSpeech proxy Worker (see /server) — the app talks to
// this instead of studio.ncspeech.ai directly, so the real NCSpeech API key
// never ships inside the compiled app bundle. This URL is not a secret; it's
// safe to inline via EXPO_PUBLIC_*. See src/services/asrService.ts and
// src/services/ttsService.ts for how it's used, and
// https://github.com/bigkozha/memory-cards/issues/1 for why this exists.
export const PROXY_BASE_URL = process.env.EXPO_PUBLIC_PROXY_BASE_URL ?? "";
