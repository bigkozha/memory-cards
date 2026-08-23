// Set EXPO_PUBLIC_NCSPEECH_API_KEY in a .env file (or your EAS/CI secrets) to
// switch the app from the mock ASR to the real NCSpeech Studio API — see
// src/services/asrService.ts. Expo inlines EXPO_PUBLIC_* vars at build time.
export const NCSPEECH_API_KEY = process.env.EXPO_PUBLIC_NCSPEECH_API_KEY ?? "";
