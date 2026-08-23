// Browsers' MediaRecorder can't record directly to WAV, and NCSpeech's ASR
// endpoint reliably handles WAV/PCM but 500s on compressed containers (AAC
// on iOS confirmed it, WebM on web confirms the same limitation). Native
// recording is set to WAV/LPCM directly (see useVoiceRecorder.ts); for web
// we decode whatever the browser gave us and re-encode to WAV here instead.
export async function transcodeToWavBlob(blob: Blob): Promise<Blob> {
  const AudioContextCtor: typeof AudioContext | undefined =
    (globalThis as any).AudioContext ?? (globalThis as any).webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("Web Audio API is not available to transcode the recording to WAV.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  const audioCtx = new AudioContextCtor();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    return new Blob([audioBufferToWav(audioBuffer)], { type: "audio/wav" });
  } finally {
    await audioCtx.close();
  }
}

function audioBufferToWav(buffer: AudioBuffer): ArrayBuffer {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;

  const interleaved =
    numChannels === 2
      ? interleaveStereo(buffer.getChannelData(0), buffer.getChannelData(1))
      : buffer.getChannelData(0);

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
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true); // byte rate
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
