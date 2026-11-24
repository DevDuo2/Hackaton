// Voice session lifecycle for the Mini App: microphone -> audio engine -> voice client.
// No DOM here. Every dependency is injected so the whole flow (permission denial, double start,
// mute, interruption, reconnection, cleanup) is unit-tested in Node (tests/js/session.test.mjs).

import { MicState } from "./mic.js";
import { ConnState } from "./voice-client.js";

export const Phase = Object.freeze({
  IDLE: MicState.IDLE,
  REQUESTING: MicState.REQUESTING,
  CONNECTING: "connecting",
  LISTENING: "listening",
  SPEAKING: "speaking",
  RECONNECTING: "reconnecting",
  ENDING: "ending",
  DISCONNECTED: "disconnected",
  ERROR: MicState.ERROR,
  DENIED: MicState.DENIED,
  NO_DEVICE: MicState.NO_DEVICE,
  BUSY: MicState.BUSY,
  UNSUPPORTED: MicState.UNSUPPORTED,
});

/** A conversation is in progress (mute applies, End finishes with a summary). */
export const LIVE_PHASES = new Set([Phase.LISTENING, Phase.SPEAKING, Phase.RECONNECTING]);
/** Something is starting/stopping: Start must be ignored. */
export const BUSY_PHASES = new Set([Phase.REQUESTING, Phase.CONNECTING, Phase.ENDING]);

const MESSAGES = {
  audioInit: "Audio tizimini ishga tushirib bo'lmadi.",
  micLost: "Mikrofon uzildi. Qayta urinib ko'ring.",
};

export class SessionController {
  #deps;
  #mic;
  #engine = null;
  #client = null;
  #attempt = 0; // bumps on every start/end/abort so stale async steps bail out

  /**
   * @param {object} deps
   * @param {(opts: {onEnded: () => void}) => object} deps.createMic   Microphone-like
   * @param {() => boolean} deps.micSupported
   * @param {() => AudioContext | null} deps.createAudioContext        must be sync (iOS unlock)
   * @param {(ctx) => boolean} deps.isAudioSupported
   * @param {(ctx, handlers) => object} deps.createEngine               AudioEngine-like
   * @param {(handlers) => object} deps.createClient                    VoiceClient-like
   * @param {() => {initData: string, mode: string, language: string, subject: string|null}} deps.getParams
   * @param {(state) => void} [deps.onChange]
   * @param {(role: string, text: string) => void} [deps.onCaption]
   */
  constructor(deps) {
    this.#deps = { onChange: () => {}, onCaption: () => {}, ...deps };
    this.#mic = deps.createMic({ onEnded: () => this.#fail(MESSAGES.micLost) });
    this.state = { phase: Phase.IDLE, muted: false, message: null, ai: null };
  }

  get engine() {
    return this.#engine;
  }

  get isLive() {
    return LIVE_PHASES.has(this.state.phase);
  }

  get isBusy() {
    return BUSY_PHASES.has(this.state.phase);
  }

  /** Start a real AI session. Returns true when connected. Call from the click handler. */
  async start() {
    if (this.isLive || this.isBusy) return false; // one session at a time
    const id = ++this.#attempt;
    const { createAudioContext, isAudioSupported, micSupported, createEngine } = this.#deps;

    // Synchronously, inside the user gesture: iOS only unlocks audio here.
    const ctx = createAudioContext();
    if (!micSupported() || !isAudioSupported(ctx)) {
      ctx?.close?.();
      this.#set({ phase: Phase.UNSUPPORTED, muted: false, message: null, ai: null });
      return false;
    }

    this.#set({ phase: Phase.REQUESTING, muted: false, message: null, ai: null });
    const { state: micState, stream } = await this.#mic.start(); // permission prompt happens here
    if (id !== this.#attempt) {
      ctx.close?.();
      return false;
    }
    if (micState !== MicState.ACTIVE || !stream) {
      ctx.close?.();
      this.#set({ phase: micState === MicState.IDLE ? Phase.IDLE : micState });
      return false;
    }

    this.#engine = createEngine(ctx, {
      onChunk: (chunk) => this.#client?.sendAudio(chunk),
      onSpeakingChange: (speaking) => {
        if (this.state.phase === Phase.LISTENING || this.state.phase === Phase.SPEAKING) {
          this.#set({ phase: speaking ? Phase.SPEAKING : Phase.LISTENING });
        }
      },
    });
    try {
      await this.#engine.attachMicrophone(stream);
    } catch {
      if (id === this.#attempt) this.#fail(MESSAGES.audioInit);
      return false;
    }
    if (id !== this.#attempt) return false;

    this.#set({ phase: Phase.CONNECTING, ai: ConnState.CONNECTING });
    this.#client = this.#deps.createClient(this.#clientHandlers());
    try {
      await this.#client.start({ ...this.#deps.getParams(), sampleRate: this.#engine.sampleRate });
    } catch (error) {
      if (id === this.#attempt) this.#fail(error.message, ConnState.ERROR);
      return false;
    }
    if (id !== this.#attempt) return false;
    this.#set({ phase: this.#engine.speaking ? Phase.SPEAKING : Phase.LISTENING, ai: ConnState.CONNECTED });
    return true;
  }

  /**
   * Finish. Microphone and audio are released immediately; then waits for the summary.
   * @returns {Promise<{ended: boolean, summary: object|null}>} ended=false if nothing was live
   */
  async end() {
    const client = this.#client;
    const wasLive = this.isLive && client?.state === ConnState.CONNECTED;
    this.#attempt++;
    this.#client = null;
    this.#releaseAudio();

    if (!wasLive) {
      client?.close();
      this.#set({ phase: Phase.IDLE, muted: false, message: null, ai: null });
      return { ended: false, summary: null };
    }
    this.#set({ phase: Phase.ENDING, muted: false, ai: ConnState.ENDING });
    const summary = await client.end();
    this.#set({ phase: Phase.IDLE, message: null, ai: null });
    return { ended: true, summary };
  }

  /** Hard stop without a summary (page hidden/closed). */
  abort() {
    this.#teardown();
    this.#set({ phase: Phase.IDLE, muted: false, message: null, ai: null });
  }

  toggleMute() {
    if (!this.isLive) return;
    const muted = !this.state.muted;
    this.#mic.setMuted(muted); // track.enabled=false: silence at the source
    this.#client?.setMuted(muted); // stop sending + tell the server (audio_stream_end)
    this.#set({ muted });
  }

  #clientHandlers() {
    return {
      onAudio: (chunk) => this.#engine?.enqueue(chunk),
      onInterrupted: () => this.#engine?.flush(), // student barged in: stop tutor audio now
      onTranscript: (role, text) => this.#deps.onCaption(role, text),
      onReconnecting: () => {
        // Keep playing audio that already arrived: after a GoAway it is valid tutor speech.
        // Only `interrupted` (the student barged in) drops the playback queue.
        if (this.isLive) this.#set({ phase: Phase.RECONNECTING, ai: "reconnecting" });
      },
      onReconnected: () => {
        if (this.state.phase === Phase.RECONNECTING) {
          this.#set({ phase: this.#engine?.speaking ? Phase.SPEAKING : Phase.LISTENING, ai: ConnState.CONNECTED });
        }
      },
      onState: (state) => {
        if (state === ConnState.DISCONNECTED && this.isLive) {
          this.#teardown();
          this.#set({ phase: Phase.DISCONNECTED, muted: false, message: null, ai: ConnState.DISCONNECTED });
        }
      },
      onError: (error) => {
        if (this.isLive) this.#fail(error.message, ConnState.ERROR);
      },
    };
  }

  #fail(message, ai = null) {
    this.#teardown();
    this.#set({ phase: Phase.ERROR, muted: false, message, ai });
  }

  #teardown() {
    this.#attempt++;
    const client = this.#client;
    this.#client = null;
    client?.close();
    this.#releaseAudio();
  }

  #releaseAudio() {
    const engine = this.#engine;
    this.#engine = null;
    engine?.close();
    this.#mic.stop(); // stops every track: the OS microphone indicator turns off
  }

  #set(patch) {
    this.state = { ...this.state, ...patch };
    this.#deps.onChange(this.state);
  }
}
