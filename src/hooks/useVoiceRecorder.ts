import { useCallback, useRef, useState } from "react";
import { Platform } from "react-native";
import {
  AudioModule,
  AudioQuality,
  IOSOutputFormat,
  RecordingOptions,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from "expo-audio";

export type RecorderPhase = "idle" | "recording" | "processing";

const WEB_RECORDING_WARMUP_MS = 400;

export class MicPermissionDeniedError extends Error {
  constructor() {
    super("Microphone permission denied");
    this.name = "MicPermissionDeniedError";
  }
}

/**
 * expo-audio's default HIGH_QUALITY preset records AAC in an .m4a container.
 * NCSpeech Studio's transcription endpoint 500s on that file as-is (confirmed
 * live: identical AAC/.m4a recordings reproducibly fail, while a 16kHz mono
 * WAV/LPCM version of the same audio transcribes successfully). Record WAV
 * directly on iOS to sidestep that. Android's MediaRecorder-backed API has no
 * WAV/PCM output option, so it stays on AAC — if NCSpeech 500s there too,
 * this will need either different Android encoder settings or a client-side
 * transcode step.
 */
const RECORDING_OPTIONS: RecordingOptions = {
  extension: ".m4a",
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  android: {
    extension: ".m4a",
    outputFormat: "mpeg4",
    audioEncoder: "aac",
  },
  ios: {
    extension: ".wav",
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
};

export function useVoiceRecorder() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const permissionGranted = useRef(false);

  const ensurePermission = useCallback(async () => {
    if (permissionGranted.current) return true;
    const { granted } = await requestRecordingPermissionsAsync();
    permissionGranted.current = granted;
    if (granted) {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    }
    return granted;
  }, []);

  /** Throws MicPermissionDeniedError, or whatever the native recorder throws, on failure. */
  const start = useCallback(async () => {
    const granted = await ensurePermission();
    if (!granted) throw new MicPermissionDeniedError();
    await recorder.prepareToRecordAsync();
    recorder.record();
    if (Platform.OS === "web") {
      // WebKit-based mobile browsers (Safari, and every other iOS browser —
      // Apple requires them all to use WebKit) are known to drop or mute
      // roughly the first 200-500ms of MediaRecorder audio right after
      // start(). For a single short word that can be the entire recording,
      // producing a transcript that's garbage despite the request
      // succeeding. Absorb that dead zone before cueing the user to speak.
      await new Promise((resolve) => setTimeout(resolve, WEB_RECORDING_WARMUP_MS));
    }
    setPhase("recording");
  }, [ensurePermission, recorder]);

  const stop = useCallback(async (): Promise<string | null> => {
    if (phase !== "recording") return null;
    setPhase("processing");
    await recorder.stop();
    return recorder.uri ?? null;
  }, [phase, recorder]);

  const reset = useCallback(() => setPhase("idle"), []);

  return { phase, start, stop, reset };
}

export function isAudioModuleAvailable() {
  return AudioModule != null;
}
