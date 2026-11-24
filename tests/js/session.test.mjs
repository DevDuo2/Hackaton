// SessionController: the Mini App's voice lifecycle with fake mic / audio / client.
import { test } from "node:test";
import assert from "node:assert/strict";

import { MicState } from "../../miniapp/mic.js";
import { ConnState, VoiceError } from "../../miniapp/voice-client.js";
import { Phase, SessionController } from "../../miniapp/session.js";

const tick = () => new Promise((r) => setTimeout(r, 0));

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}

function harness({ micResult = { state: MicState.ACTIVE, stream: {} }, supported = true, attachError, clientStart } = {}) {
  const log = [];
  const phases = [];
  const ctx = { closed: false, close() { this.closed = true; } };

  const mic = {
    onEnded: null,
    started: 0,
    stopped: 0,
    muted: null,
    pending: null,
    async start() {
      this.started++;
      log.push("mic.start");
      if (this.pending) return this.pending.promise;
      return micResult;
    },
    stop() { this.stopped++; log.push("mic.stop"); },
    setMuted(m) { this.muted = m; },
  };

  const engine = {
    closed: false, flushed: 0, enqueued: [], speaking: false, sampleRate: 48000, handlers: null,
    async attachMicrophone() { if (attachError) throw attachError; },
    enqueue(chunk) { this.enqueued.push(chunk); },
    flush() { this.flushed++; },
    close() { this.closed = true; log.push("engine.close"); },
  };

  const client = {
    state: ConnState.IDLE, handlers: null, startParams: null, muted: null, closed: 0, ended: 0,
    endResult: { status: "ok" },
    async start(params) {
      this.startParams = params;
      if (clientStart) return clientStart(this);
      this.state = ConnState.CONNECTED;
      return { maxSeconds: 600 };
    },
    sendAudio() {},
    setMuted(m) { this.muted = m; },
    async end() { this.ended++; log.push("client.end"); return this.endResult; },
    close() { this.closed++; log.push("client.close"); },
  };

  let clientsCreated = 0;
  const controller = new SessionController({
    createMic: ({ onEnded }) => ((mic.onEnded = onEnded), mic),
    micSupported: () => supported,
    createAudioContext: () => ctx,
    isAudioSupported: () => supported,
    createEngine: (_ctx, handlers) => ((engine.handlers = handlers), engine),
    createClient: (handlers) => (clientsCreated++, (client.handlers = handlers), client),
    getParams: () => ({ initData: "signed", mode: "tutor", language: "uz", subject: "math" }),
    onChange: (s) => phases.push(s.phase),
  });
  return { controller, mic, engine, client, ctx, log, phases, clientsCreated: () => clientsCreated };
}

test("start goes requesting -> connecting -> listening and passes the real sample rate", async () => {
  const h = harness();
  assert.equal(h.mic.started, 0, "nothing touches the mic before start()");
  assert.equal(await h.controller.start(), true);
  assert.deepEqual(h.phases, [Phase.REQUESTING, Phase.CONNECTING, Phase.LISTENING]);
  assert.equal(h.client.startParams.sampleRate, 48000);
  assert.equal(h.client.startParams.initData, "signed");
  assert.equal(h.controller.state.ai, ConnState.CONNECTED);
});

test("microphone permission denial: no audio engine, no server session, context closed", async () => {
  const h = harness({ micResult: { state: MicState.DENIED } });
  assert.equal(await h.controller.start(), false);
  assert.equal(h.controller.state.phase, Phase.DENIED);
  assert.equal(h.clientsCreated(), 0);
  assert.equal(h.engine.handlers, null);
  assert.equal(h.ctx.closed, true);
});

test("unsupported browser never requests the microphone", async () => {
  const h = harness({ supported: false });
  assert.equal(await h.controller.start(), false);
  assert.equal(h.controller.state.phase, Phase.UNSUPPORTED);
  assert.equal(h.mic.started, 0);
});

test("multiple sessions are prevented while one is starting or live", async () => {
  const h = harness();
  h.mic.pending = deferred();
  const first = h.controller.start();
  assert.equal(await h.controller.start(), false, "second start while requesting is ignored");
  h.mic.pending.resolve({ state: MicState.ACTIVE, stream: {} });
  assert.equal(await first, true);
  assert.equal(await h.controller.start(), false, "second start while live is ignored");
  assert.equal(h.mic.started, 1);
  assert.equal(h.clientsCreated(), 1);
});

test("end releases mic and audio BEFORE waiting for the summary, then returns it", async () => {
  const h = harness();
  await h.controller.start();
  const result = await h.controller.end();
  assert.deepEqual(result, { ended: true, summary: { status: "ok" } });
  assert.ok(h.log.indexOf("engine.close") < h.log.indexOf("client.end"));
  assert.ok(h.log.indexOf("mic.stop") < h.log.indexOf("client.end"));
  assert.equal(h.controller.state.phase, Phase.IDLE);
  assert.equal(h.controller.engine, null);
});

test("end during the permission prompt cancels cleanly (no session is created later)", async () => {
  const h = harness();
  h.mic.pending = deferred();
  const starting = h.controller.start();
  const result = await h.controller.end();
  assert.deepEqual(result, { ended: false, summary: null });
  h.mic.pending.resolve({ state: MicState.ACTIVE, stream: {} });
  assert.equal(await starting, false);
  assert.equal(h.clientsCreated(), 0);
  assert.equal(h.ctx.closed, true);
  assert.equal(h.controller.state.phase, Phase.IDLE);
});

test("mute and unmute: mic track and client are both toggled; ignored when not live", async () => {
  const h = harness();
  h.controller.toggleMute();
  assert.equal(h.mic.muted, null, "no-op before the session is live");
  await h.controller.start();
  h.controller.toggleMute();
  assert.equal(h.mic.muted, true);
  assert.equal(h.client.muted, true);
  assert.equal(h.controller.state.muted, true);
  h.controller.toggleMute();
  assert.equal(h.mic.muted, false);
  assert.equal(h.client.muted, false);
  assert.equal(h.controller.state.muted, false);
});

test("AI interruption flushes playback immediately", async () => {
  const h = harness();
  await h.controller.start();
  h.client.handlers.onAudio(new ArrayBuffer(4));
  h.client.handlers.onInterrupted();
  assert.equal(h.engine.enqueued.length, 1);
  assert.equal(h.engine.flushed, 1);
});

test("speaking state follows the audio engine", async () => {
  const h = harness();
  await h.controller.start();
  h.engine.handlers.onSpeakingChange(true);
  assert.equal(h.controller.state.phase, Phase.SPEAKING);
  h.engine.handlers.onSpeakingChange(false);
  assert.equal(h.controller.state.phase, Phase.LISTENING);
});

test("audio engine failure cleans up mic and reports an error", async () => {
  const h = harness({ attachError: new Error("worklet failed") });
  assert.equal(await h.controller.start(), false);
  assert.equal(h.controller.state.phase, Phase.ERROR);
  assert.equal(h.mic.stopped, 1);
  assert.equal(h.engine.closed, true);
  assert.equal(h.clientsCreated(), 0);
});

test("connection failure (e.g. missing API key) cleans everything and shows the server message", async () => {
  const h = harness({
    clientStart: () => Promise.reject(new VoiceError("ai_not_configured", "AI ustoz serverda sozlanmagan")),
  });
  assert.equal(await h.controller.start(), false);
  assert.equal(h.controller.state.phase, Phase.ERROR);
  assert.equal(h.controller.state.message, "AI ustoz serverda sozlanmagan");
  assert.equal(h.mic.stopped, 1);
  assert.equal(h.engine.closed, true);
  assert.equal(h.client.closed, 1);
});

test("reconnecting keeps already-received tutor audio and the mic, then resumes listening", async () => {
  const h = harness();
  await h.controller.start();
  h.client.handlers.onAudio(new ArrayBuffer(4));
  h.client.handlers.onReconnecting();
  assert.equal(h.controller.state.phase, Phase.RECONNECTING);
  assert.equal(h.engine.flushed, 0, "GoAway must not cut the tutor off mid-sentence");
  assert.equal(h.mic.stopped, 0, "microphone stays open during a transparent reconnect");
  h.client.handlers.onReconnected();
  assert.equal(h.controller.state.phase, Phase.LISTENING);
});

test("unexpected disconnect tears down mic and audio", async () => {
  const h = harness();
  await h.controller.start();
  h.client.handlers.onState(ConnState.DISCONNECTED);
  assert.equal(h.controller.state.phase, Phase.DISCONNECTED);
  assert.equal(h.mic.stopped, 1);
  assert.equal(h.engine.closed, true);
});

test("mid-session AI error tears down and shows the message", async () => {
  const h = harness();
  await h.controller.start();
  h.client.handlers.onError(new VoiceError("ai_connection_lost", "AI bilan aloqa uzildi."));
  assert.equal(h.controller.state.phase, Phase.ERROR);
  assert.equal(h.controller.state.message, "AI bilan aloqa uzildi.");
  assert.equal(h.client.closed, 1);
  assert.equal(h.mic.stopped, 1);
});

test("microphone unplugged mid-session tears down", async () => {
  const h = harness();
  await h.controller.start();
  h.mic.onEnded();
  assert.equal(h.controller.state.phase, Phase.ERROR);
  assert.equal(h.client.closed, 1);
  assert.equal(h.engine.closed, true);
});

test("abort (page hidden/closed) releases everything without a summary", async () => {
  const h = harness();
  await h.controller.start();
  h.controller.abort();
  assert.equal(h.client.ended, 0);
  assert.equal(h.client.closed, 1);
  assert.equal(h.mic.stopped, 1);
  assert.equal(h.engine.closed, true);
  assert.equal(h.controller.state.phase, Phase.IDLE);
});

test("a new session can start after the previous one ended", async () => {
  const h = harness();
  await h.controller.start();
  await h.controller.end();
  h.client.state = ConnState.IDLE;
  assert.equal(await h.controller.start(), true);
  await tick();
  assert.equal(h.clientsCreated(), 2);
});
