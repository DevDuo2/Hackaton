// Browser audio engine: mic -> PCM16 chunks, and gapless playback of 24 kHz PCM16 from the tutor.
// One AudioContext for everything; it must be created synchronously inside the click handler
// (iOS only allows audio to start from a user gesture).

import { OUTPUT_SAMPLE_RATE, pcm16ToFloat32 } from "./pcm.js";

const START_LEAD_SECONDS = 0.08; // jitter buffer when playback (re)starts
const SPEAKING_HOLD_MS = 250; // ignore sub-250 ms gaps between tutor audio chunks

export function createAudioContext() {
  const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtx) return null;
  const ctx = new AudioCtx({ latencyHint: "interactive" });
  ctx.resume?.();
  return ctx;
}

export function isAudioEngineSupported(ctx) {
  return Boolean(ctx?.audioWorklet);
}

export class AudioEngine {
  #ctx;
  #source = null;
  #worklet = null;
  #sink = null;
  #playing = new Set();
  #nextStart = 0;
  #speaking = false;
  #silenceTimer = 0;

  /** @param {{ onChunk: (buf: ArrayBuffer) => void, onSpeakingChange: (speaking: boolean) => void }} handlers */
  constructor(ctx, { onChunk, onSpeakingChange }) {
    this.#ctx = ctx;
    this.onChunk = onChunk;
    this.onSpeakingChange = onSpeakingChange;
    this.inputAnalyser = ctx.createAnalyser();
    this.outputAnalyser = ctx.createAnalyser();
    for (const a of [this.inputAnalyser, this.outputAnalyser]) {
      a.fftSize = 256;
      a.smoothingTimeConstant = 0.75;
    }
    this.outputAnalyser.connect(ctx.destination);
  }

  get sampleRate() {
    return this.#ctx.sampleRate;
  }

  get speaking() {
    return this.#speaking;
  }

  async attachMicrophone(stream) {
    await this.#ctx.audioWorklet.addModule(new URL("./pcm-worklet.js", import.meta.url));
    this.#source = this.#ctx.createMediaStreamSource(stream);
    this.#worklet = new AudioWorkletNode(this.#ctx, "pcm-capture", { numberOfInputs: 1, numberOfOutputs: 1 });
    this.#worklet.port.onmessage = (event) => this.onChunk(event.data);
    // Silent sink keeps the worklet pulled by the graph in every engine, without echoing the mic.
    this.#sink = this.#ctx.createGain();
    this.#sink.gain.value = 0;
    this.#source.connect(this.inputAnalyser);
    this.#source.connect(this.#worklet);
    this.#worklet.connect(this.#sink).connect(this.#ctx.destination);
  }

  /** Queue one PCM16 24 kHz chunk right after the previous one. */
  enqueue(arrayBuffer) {
    const samples = pcm16ToFloat32(arrayBuffer);
    if (!samples.length || this.#ctx.state === "closed") return;
    const buffer = this.#ctx.createBuffer(1, samples.length, OUTPUT_SAMPLE_RATE);
    buffer.copyToChannel(samples, 0);
    const node = this.#ctx.createBufferSource();
    node.buffer = buffer;
    node.connect(this.outputAnalyser);

    const now = this.#ctx.currentTime;
    // Fresh start (queue drained): a small lead absorbs network jitter between the first chunks.
    const lead = this.#nextStart > now ? 0 : START_LEAD_SECONDS;
    const startAt = Math.max(now + lead, this.#nextStart);
    node.start(startAt);
    this.#nextStart = startAt + buffer.duration;
    this.#playing.add(node);
    node.onended = () => {
      this.#playing.delete(node);
      if (this.#playing.size === 0) this.#scheduleSilence();
    };
    clearTimeout(this.#silenceTimer);
    this.#setSpeaking(true);
  }

  /** The queue can drain for a moment between network chunks; don't flip the UI to "listening"
   *  unless no new audio arrives within SPEAKING_HOLD_MS (seen in a real Gemini test). */
  #scheduleSilence() {
    clearTimeout(this.#silenceTimer);
    this.#silenceTimer = setTimeout(() => {
      if (this.#playing.size === 0) this.#setSpeaking(false);
    }, SPEAKING_HOLD_MS);
  }

  /** Student interrupted: drop everything queued immediately. */
  flush() {
    for (const node of this.#playing) {
      node.onended = null;
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    }
    this.#playing.clear();
    this.#nextStart = 0;
    clearTimeout(this.#silenceTimer);
    this.#setSpeaking(false); // interruption: immediately, no hold
  }

  async close() {
    this.flush();
    if (this.#worklet) this.#worklet.port.onmessage = null;
    for (const node of [this.#source, this.#worklet, this.#sink, this.inputAnalyser, this.outputAnalyser]) {
      node?.disconnect();
    }
    if (this.#ctx.state !== "closed") await this.#ctx.close().catch(() => {});
  }

  #setSpeaking(value) {
    if (this.#speaking === value) return;
    this.#speaking = value;
    this.onSpeakingChange?.(value);
  }
}
