// PCM16 helpers. Live API audio is raw 16-bit little-endian mono PCM:
// input at any rate (declared in the MIME type), output at 24 kHz.

export const OUTPUT_SAMPLE_RATE = 24000;

/** Float32 [-1, 1] -> Int16 (clamped). */
export function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** ArrayBuffer of Int16 LE -> Float32 [-1, 1). Odd trailing byte is ignored. */
export function pcm16ToFloat32(buffer) {
  const view = new DataView(buffer);
  const samples = Math.floor(buffer.byteLength / 2);
  const out = new Float32Array(samples);
  for (let i = 0; i < samples; i++) out[i] = view.getInt16(i * 2, true) / 0x8000;
  return out;
}
