// Browsers' MediaRecorder can't record directly to WAV, and NCSpeech's ASR
// endpoint reliably handles WAV/PCM but 500s on compressed containers (AAC
// on iOS confirmed it, WebM on web confirms the same limitation). Native
// recording is set to WAV/LPCM directly (see useVoiceRecorder.ts); for web
// we decode whatever the browser gave us and re-encode to WAV here instead.
//
// WebKit-based mobile browsers (Safari, and every other iOS browser — Apple
// requires them all to use WebKit) are known to record a stretch of
// near-silent "dead air" right after MediaRecorder starts. A fixed startup
// delay (see useVoiceRecorder.ts) helps but the exact dead-zone length
// varies, so we also trim leading/trailing silence from the decoded audio
// here — confirmed live on iPhone Safari: a well-formed 1.245s WAV came back
// from NCSpeech with an empty transcript (confidence defaulting to 0.85,
// meaning no speech segments were found at all), consistent with the actual
// voiced portion being diluted or absent from what got sent.
export async function transcodeToWavBlob(blob: Blob): Promise<Blob> {
  const AudioContextCtor: typeof AudioContext | undefined =
    (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("Web Audio API is not available to transcode the recording to WAV.");
  }

  console.log(`[transcode] input blob: ${blob.type}, ${blob.size} bytes`);
  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContextCtor();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const peak = peakAmplitude(audioBuffer);
    console.log(
      `[transcode] decoded: ${audioBuffer.duration.toFixed(3)}s, ` +
        `${audioBuffer.numberOfChannels}ch, ${audioBuffer.sampleRate}Hz, peak amplitude: ${peak.toFixed(4)}`
    );

    const trimmed = trimSilence(audioBuffer);
    console.log(
      `[transcode] after silence trim: kept ${trimmed.duration.toFixed(3)}s ` +
        `of ${audioBuffer.duration.toFixed(3)}s`
    );

    const wavBlob = new Blob([encodeWav(trimmed)], { type: "audio/wav" });
    console.log(`[transcode] output WAV: ${wavBlob.size} bytes`);
    return wavBlob;
  } finally {
    await audioCtx.close();
  }
}

interface TrimmedAudio {
  channels: Float32Array[];
  sampleRate: number;
  duration: number;
}

function peakAmplitude(buffer: AudioBuffer): number {
  let peak = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
  }
  return peak;
}

// Generous threshold (~ -34dB) so we keep quiet speech rather than risk
// trimming it — this only needs to catch true dead-air, not shape dynamics.
const SILENCE_THRESHOLD = 0.02;
const PADDING_MS = 100;

/** Trims leading/trailing near-silence. Falls back to the untrimmed buffer if the whole thing looks silent — better to send it as-is and let the ASR response tell us, than send nothing. */
function trimSilence(buffer: AudioBuffer): TrimmedAudio {
  const numChannels = buffer.numberOfChannels;
  const channels = Array.from({ length: numChannels }, (_, i) => buffer.getChannelData(i));
  const length = channels[0].length;
  const padding = Math.round((PADDING_MS / 1000) * buffer.sampleRate);

  let start = -1;
  for (let i = 0; i < length && start === -1; i++) {
    for (const ch of channels) {
      if (Math.abs(ch[i]) > SILENCE_THRESHOLD) {
        start = i;
        break;
      }
    }
  }

  let end = -1;
  for (let i = length - 1; i >= 0 && end === -1; i--) {
    for (const ch of channels) {
      if (Math.abs(ch[i]) > SILENCE_THRESHOLD) {
        end = i + 1;
        break;
      }
    }
  }

  if (start === -1 || end === -1 || end <= start) {
    // Looks entirely silent — don't trim it away to nothing, send as-is.
    return { channels, sampleRate: buffer.sampleRate, duration: buffer.duration };
  }

  const trimmedStart = Math.max(0, start - padding);
  const trimmedEnd = Math.min(length, end + padding);
  const trimmedChannels = channels.map((data) => data.subarray(trimmedStart, trimmedEnd));

  return {
    channels: trimmedChannels,
    sampleRate: buffer.sampleRate,
    duration: (trimmedEnd - trimmedStart) / buffer.sampleRate,
  };
}

function encodeWav(audio: TrimmedAudio): ArrayBuffer {
  const numChannels = audio.channels.length;
  const bitDepth = 16;

  const interleaved =
    numChannels === 2 ? interleaveStereo(audio.channels[0], audio.channels[1]) : audio.channels[0];

  const dataLength = interleaved.length * (bitDepth / 8);
  const arrayBuffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // format = PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * numChannels * (bitDepth / 8), true); // byte rate
  view.setUint16(32, numChannels * (bitDepth / 8), true); // block align
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  floatTo16BitPCM(view, 44, interleaved);

  return arrayBuffer;
}

function interleaveStereo(left: Float32Array, right: Float32Array): Float32Array {
  const result = new Float32Array(left.length + right.length);
  for (let i = 0; i < left.length; i++) {
    result[i * 2] = left[i];
    result[i * 2 + 1] = right[i];
  }
  return result;
}

function floatTo16BitPCM(view: DataView, offset: number, input: Float32Array) {
  for (let i = 0; i < input.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, input[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
}

function writeString(view: DataView, offset: number, text: string) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}
