// VOXY voice session client: HTTPS ticket exchange + WebSocket protocol (see app/services/live_bridge.py).
// No DOM and no audio here; fetch/WebSocket are injected so this can be unit-tested in Node.

export const ConnState = Object.freeze({
  IDLE: "idle",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ENDING: "ending",
  DISCONNECTED: "disconnected",
  ERROR: "error",
});

export class VoiceError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "VoiceError";
    this.code = code;
  }
}

const OPEN = 1;
const SERVICE_RESTART = 1012; // WebSocket close code sent by the server on graceful shutdown
const noop = () => {};
// Real-time audio: if the uplink can't keep up, drop frames instead of building seconds of latency.
export const MAX_BUFFERED_BYTES = 96_000; // ~1 s of 48 kHz PCM16

export function wsUrlFor(baseUrl, wsPath, ticket) {
  const url = new URL(wsPath, baseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.searchParams.set("ticket", ticket);
  return url.toString();
}

export class VoiceClient {
  #fetch;
  #WebSocket;
  #baseUrl;
  #ws = null;
  #muted = false;
  #endResolve = null;
  #timers = new Set();
  #aborted = false;
  #reconnecting = false;

  constructor({
    fetch: fetchImpl = globalThis.fetch?.bind(globalThis),
    WebSocket: WebSocketImpl = globalThis.WebSocket,
    baseUrl,
    connectTimeoutMs = 15000,
    summaryTimeoutMs = 40000, // > server SUMMARY_TIMEOUT_SECONDS (30 s) + network
    onState = noop,
    onAudio = noop,
    onInterrupted = noop,
    onTranscript = noop,
    onSummary = noop,
    onError = noop,
    onReconnecting = noop,
    onReconnected = noop,
  }) {
    this.#fetch = fetchImpl;
    this.#WebSocket = WebSocketImpl;
    this.#baseUrl = baseUrl;
    this.connectTimeoutMs = connectTimeoutMs;
    this.summaryTimeoutMs = summaryTimeoutMs;
    Object.assign(this, {
      onState, onAudio, onInterrupted, onTranscript, onSummary, onError, onReconnecting, onReconnected,
    });
    this.state = ConnState.IDLE;
    this.droppedFrames = 0;
  }

  /** Create a server session and open the WebSocket. Resolves when the AI is ready; throws VoiceError. */
  async start({ initData, mode, language, subject, sampleRate }) {
    if (this.#ws) throw new VoiceError("already_started", "Suhbat allaqachon boshlangan.");
    this.#aborted = false;
    this.#setState(ConnState.CONNECTING);

    let session;
    try {
      const response = await this.#fetch(new URL("api/voice/session", this.#baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ init_data: initData ?? "", mode, language, subject, input_sample_rate: sampleRate }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new VoiceError(body.error ?? `http_${response.status}`, body.message ?? "Server xatosi.");
      session = body;
    } catch (error) {
      if (this.#aborted) throw new VoiceError("aborted", "Bekor qilindi.");
      throw this.#fail(error instanceof VoiceError ? error : new VoiceError("network", "Serverga ulanib bo'lmadi."));
    }
    if (this.#aborted) throw new VoiceError("aborted", "Bekor qilindi."); // close() during the POST

    return new Promise((resolve, reject) => {
      const ws = new this.#WebSocket(wsUrlFor(this.#baseUrl, session.ws_path, session.ticket));
      ws.binaryType = "arraybuffer";
      this.#ws = ws;
      let ready = false;

      const timer = this.#after(this.connectTimeoutMs, () => {
        if (!ready) {
          reject(this.#fail(new VoiceError("timeout", "AI ulanishi juda uzoq davom etdi.")));
          this.#closeSocket();
        }
      });

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") {
          this.onAudio(event.data);
          return;
        }
        let msg;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (msg.type) {
          case "ready":
            ready = true;
            this.#clear(timer);
            this.#setState(ConnState.CONNECTED);
            resolve({ maxSeconds: msg.max_seconds });
            break;
          case "interrupted":
            this.onInterrupted();
            break;
          case "reconnecting": // backend lost Gemini and is resuming the same conversation
            this.#reconnecting = true;
            this.onReconnecting();
            break;
          case "reconnected":
            this.#reconnecting = false;
            this.onReconnected();
            break;
          case "transcript":
            this.onTranscript(msg.role, msg.text);
            break;
          case "summary":
            this.onSummary(msg.summary, msg.reason);
            this.#resolveEnd(msg.summary);
            break;
          case "error": {
            const error = this.#fail(new VoiceError(msg.code ?? "error", msg.message ?? "Xatolik."));
            if (!ready) reject(error);
            this.#resolveEnd(null);
            break;
          }
          default:
            break; // turn_complete, go_away: informational
        }
      };

      ws.onclose = (event) => {
        this.#ws = null;
        this.#clear(timer);
        if (this.#aborted) {
          if (!ready) reject(new VoiceError("aborted", "Bekor qilindi."));
          return;
        }
        if (event?.code === SERVICE_RESTART && this.state === ConnState.CONNECTED) {
          // The backend is restarting/deploying (uvicorn closes WebSockets with 1012 on SIGTERM).
          this.#fail(new VoiceError("server_restarting", "Server yangilanmoqda. Bir daqiqadan so'ng qayta boshlang."));
          this.#resolveEnd(null);
          return;
        }
        if (!ready) {
          if (this.state !== ConnState.ERROR) reject(this.#fail(new VoiceError("closed", "Ulanish yopildi.")));
          return;
        }
        if (this.state === ConnState.CONNECTED) this.#setState(ConnState.DISCONNECTED);
        else if (this.state === ConnState.ENDING) this.#setState(ConnState.IDLE);
        this.#resolveEnd(null);
      };

      ws.onerror = () => {
        /* onclose always follows; handled there */
      };
    });
  }

  get isOpen() {
    return this.#ws?.readyState === OPEN && this.state === ConnState.CONNECTED;
  }

  get reconnecting() {
    return this.#reconnecting;
  }

  sendAudio(chunk) {
    if (!this.isOpen || this.#muted || this.#reconnecting) return;
    if (this.#ws.bufferedAmount > MAX_BUFFERED_BYTES) {
      this.droppedFrames++;
      return;
    }
    this.#ws.send(chunk);
  }

  setMuted(muted) {
    if (this.#muted === muted) return;
    this.#muted = muted;
    if (this.isOpen) this.#ws.send(JSON.stringify({ type: muted ? "mute" : "unmute" }));
  }

  /** Ask the server to finish and wait for the summary (or null on timeout/close). */
  end() {
    if (!this.#ws || this.state !== ConnState.CONNECTED) {
      this.close();
      return Promise.resolve(null);
    }
    this.#setState(ConnState.ENDING);
    this.#ws.send(JSON.stringify({ type: "end" }));
    return new Promise((resolve) => {
      this.#endResolve = resolve;
      this.#after(this.summaryTimeoutMs, () => {
        this.#resolveEnd(null);
        this.#closeSocket();
      });
    });
  }

  /** Drop the connection immediately, no summary. Safe to call repeatedly. */
  close() {
    this.#aborted = true;
    this.#closeSocket();
    this.#resolveEnd(null);
    for (const t of this.#timers) clearTimeout(t);
    this.#timers.clear();
    if (this.state !== ConnState.ERROR) this.#setState(ConnState.IDLE);
  }

  #closeSocket() {
    const ws = this.#ws;
    this.#ws = null;
    if (ws && ws.readyState <= OPEN) {
      ws.onmessage = null;
      try {
        ws.close(1000);
      } catch {
        /* ignore */
      }
    }
  }

  #resolveEnd(value) {
    const resolve = this.#endResolve;
    this.#endResolve = null;
    resolve?.(value);
  }

  #fail(error) {
    this.#setState(ConnState.ERROR);
    this.onError(error);
    return error;
  }

  #setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.onState(state);
  }

  #after(ms, fn) {
    const t = setTimeout(() => {
      this.#timers.delete(t);
      fn();
    }, ms);
    this.#timers.add(t);
    return t;
  }

  #clear(t) {
    clearTimeout(t);
    this.#timers.delete(t);
  }
}
