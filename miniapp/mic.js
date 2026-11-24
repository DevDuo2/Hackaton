// Microphone access for the VOXY Mini App.
// No DOM access here: everything goes through an injected `env` (defaults to globalThis)
// so the logic can be unit-tested with Node's test runner.

export const MicState = Object.freeze({
  IDLE: "idle",
  REQUESTING: "requesting",
  ACTIVE: "active",
  DENIED: "denied",
  NO_DEVICE: "no-device",
  BUSY: "busy",
  UNSUPPORTED: "unsupported",
  ERROR: "error",
});

export const AUDIO_CONSTRAINTS = Object.freeze({
  audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  video: false,
});

export function isSupported(env = globalThis) {
  if (env.isSecureContext === false) return false; // getUserMedia requires HTTPS
  return typeof env.navigator?.mediaDevices?.getUserMedia === "function";
}

export function classifyError(error) {
  switch (error?.name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return MicState.DENIED;
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return MicState.NO_DEVICE;
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return MicState.BUSY;
    default:
      return MicState.ERROR;
  }
}

/**
 * Read the current permission WITHOUT prompting the user.
 * Resolves to "granted" | "denied" | "prompt" | "unknown".
 */
export async function queryPermission(env = globalThis) {
  try {
    const status = await env.navigator?.permissions?.query({ name: "microphone" });
    return status?.state ?? "unknown";
  } catch {
    return "unknown"; // Safari / some WebViews don't support querying "microphone"
  }
}

export function stopStream(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export class Microphone {
  #env;
  #stream = null;
  #requestId = 0;
  #onEnded;

  /** @param {{ env?: object, onEnded?: () => void }} [options] */
  constructor({ env = globalThis, onEnded } = {}) {
    this.#env = env;
    this.#onEnded = onEnded;
    this.state = isSupported(env) ? MicState.IDLE : MicState.UNSUPPORTED;
  }

  get stream() {
    return this.#stream;
  }

  get isActive() {
    return this.#stream !== null;
  }

  /** Ask for the microphone. Must be called from a user gesture. Never throws. */
  async start() {
    if (!isSupported(this.#env)) {
      this.state = MicState.UNSUPPORTED;
      return { state: this.state };
    }
    if (this.#stream) return { state: MicState.ACTIVE, stream: this.#stream };

    const requestId = ++this.#requestId;
    this.state = MicState.REQUESTING;
    try {
      const stream = await this.#env.navigator.mediaDevices.getUserMedia(AUDIO_CONSTRAINTS);
      if (requestId !== this.#requestId) {
        // stop() was called while the permission prompt was open — release immediately.
        stopStream(stream);
        return { state: this.state };
      }
      this.#stream = stream;
      this.state = MicState.ACTIVE;
      stream.getAudioTracks().forEach((track) => {
        track.addEventListener?.("ended", () => this.#handleEnded(stream));
      });
      return { state: this.state, stream };
    } catch (error) {
      if (requestId !== this.#requestId) return { state: this.state };
      this.state = classifyError(error);
      return { state: this.state, error };
    }
  }

  setMuted(muted) {
    this.#stream?.getAudioTracks().forEach((track) => {
      track.enabled = !muted;
    });
  }

  /** Release all tracks so the OS microphone indicator turns off. Safe to call repeatedly. */
  stop() {
    this.#requestId++;
    stopStream(this.#stream);
    this.#stream = null;
    if (this.state === MicState.ACTIVE || this.state === MicState.REQUESTING) {
      this.state = MicState.IDLE;
    }
  }

  #handleEnded(stream) {
    if (stream !== this.#stream) return;
    this.stop();
    this.#onEnded?.();
  }
}
