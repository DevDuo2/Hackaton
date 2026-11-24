// Run with: node --test "tests/js/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";

import { ConnState, MAX_BUFFERED_BYTES, VoiceClient, VoiceError, wsUrlFor } from "../../miniapp/voice-client.js";
import { floatTo16BitPCM, pcm16ToFloat32 } from "../../miniapp/pcm.js";

const BASE = new URL("https://voxy.example.com/");

class FakeSocket {
  static last = null;
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.bufferedAmount = 0;
    this.sent = [];
    this.closedWith = null;
    FakeSocket.last = this;
  }
  send(data) {
    this.sent.push(data);
  }
  close(code) {
    this.closedWith = code;
    this.readyState = 3;
    queueMicrotask(() => this.onclose?.({ code }));
  }
  // test helpers
  open() {
    this.readyState = 1;
  }
  serverJson(payload) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
  serverBinary(buffer) {
    this.onmessage?.({ data: buffer });
  }
  serverClose(code = 1006) {
    this.readyState = 3;
    this.onclose?.({ code });
  }
}

function okFetch(body = { ticket: "t1", ws_path: "/api/voice/ws" }) {
  const calls = [];
  const fn = async (url, init) => {
    calls.push({ url: String(url), init });
    return { ok: true, status: 200, json: async () => body };
  };
  fn.calls = calls;
  return fn;
}

function failFetch(status, body) {
  return async () => ({ ok: false, status, json: async () => body });
}

function client(overrides = {}) {
  const events = { states: [], audio: [], interrupted: 0, transcripts: [], errors: [] };
  const c = new VoiceClient({
    fetch: okFetch(),
    WebSocket: FakeSocket,
    baseUrl: BASE,
    connectTimeoutMs: 200,
    summaryTimeoutMs: 200,
    onState: (s) => events.states.push(s),
    onAudio: (a) => events.audio.push(a),
    onInterrupted: () => events.interrupted++,
    onTranscript: (role, text) => events.transcripts.push([role, text]),
    onError: (e) => events.errors.push(e.code),
    ...overrides,
  });
  return { c, events };
}

const START = { initData: "x", mode: "tutor", language: "uz", subject: "math", sampleRate: 48000 };
const tick = () => new Promise((r) => setTimeout(r, 0));

async function connected(overrides) {
  const ctx = client(overrides);
  const started = ctx.c.start(START);
  await tick();
  FakeSocket.last.open();
  FakeSocket.last.serverJson({ type: "ready", max_seconds: 600 });
  await started;
  return { ...ctx, ws: FakeSocket.last };
}

test("wsUrlFor switches to wss and adds the ticket", () => {
  assert.equal(wsUrlFor(BASE, "/api/voice/ws", "a b"), "wss://voxy.example.com/api/voice/ws?ticket=a+b");
  assert.equal(wsUrlFor(new URL("http://localhost:8000/"), "/api/voice/ws", "t"), "ws://localhost:8000/api/voice/ws?ticket=t");
});

test("start posts session params and resolves on ready", async () => {
  const fetch = okFetch();
  const { c, events, ws } = await connected({ fetch });
  assert.equal(fetch.calls[0].url, "https://voxy.example.com/api/voice/session");
  assert.deepEqual(JSON.parse(fetch.calls[0].init.body), {
    init_data: "x", mode: "tutor", language: "uz", subject: "math", input_sample_rate: 48000,
  });
  assert.equal(ws.binaryType, "arraybuffer");
  assert.equal(c.state, ConnState.CONNECTED);
  assert.deepEqual(events.states, [ConnState.CONNECTING, ConnState.CONNECTED]);
});

test("server errors on session creation reject with the server's code", async () => {
  const { c, events } = client({
    fetch: failFetch(503, { error: "ai_not_configured", message: "AI ustoz serverda sozlanmagan" }),
  });
  await assert.rejects(c.start(START), (e) => e instanceof VoiceError && e.code === "ai_not_configured");
  assert.equal(c.state, ConnState.ERROR);
  assert.deepEqual(events.errors, ["ai_not_configured"]);
});

test("network failure rejects with code network", async () => {
  const { c } = client({ fetch: async () => { throw new TypeError("Failed to fetch"); } });
  await assert.rejects(c.start(START), (e) => e.code === "network");
});

test("error frame before ready rejects (e.g. invalid API key)", async () => {
  const { c } = client();
  const started = c.start(START);
  await tick();
  FakeSocket.last.serverJson({ type: "error", code: "ai_auth_failed", message: "kalit noto'g'ri" });
  await assert.rejects(started, (e) => e.code === "ai_auth_failed");
});

test("connect timeout rejects and closes the socket", async () => {
  const { c } = client();
  const started = c.start(START);
  await assert.rejects(started, (e) => e.code === "timeout");
  assert.equal(FakeSocket.last.closedWith, 1000);
});

test("audio, interruption and transcripts are dispatched", async () => {
  const { events, ws } = await connected();
  const pcm = new ArrayBuffer(4);
  ws.serverBinary(pcm);
  ws.serverJson({ type: "interrupted" });
  ws.serverJson({ type: "transcript", role: "tutor", text: "Salom" });
  assert.deepEqual(events.audio, [pcm]);
  assert.equal(events.interrupted, 1);
  assert.deepEqual(events.transcripts, [["tutor", "Salom"]]);
});

test("sendAudio only while connected and unmuted; mute is signalled", async () => {
  const { c, ws } = await connected();
  const chunk = new ArrayBuffer(8);
  c.sendAudio(chunk);
  c.setMuted(true);
  c.sendAudio(chunk);
  c.setMuted(false);
  assert.deepEqual(ws.sent, [chunk, '{"type":"mute"}', '{"type":"unmute"}']);
});

test("end sends end and resolves with the summary", async () => {
  const { c, ws } = await connected();
  const ending = c.end();
  assert.equal(c.state, ConnState.ENDING);
  assert.equal(ws.sent.at(-1), '{"type":"end"}');
  ws.serverJson({ type: "summary", reason: "client_end", summary: { status: "ok", duration_seconds: 12 } });
  ws.serverClose();
  assert.deepEqual(await ending, { status: "ok", duration_seconds: 12 });
  assert.equal(c.state, ConnState.IDLE);
});

test("end resolves null when the summary never arrives", async () => {
  const { c, ws } = await connected();
  assert.equal(await c.end(), null);
  assert.equal(ws.closedWith, 1000);
});

test("unexpected close while connected reports disconnected", async () => {
  const { c, events, ws } = await connected();
  ws.serverClose();
  assert.equal(c.state, ConnState.DISCONNECTED);
  assert.equal(events.states.at(-1), ConnState.DISCONNECTED);
});

test("server restart (close 1012) is reported as server_restarting, not a silent disconnect", async () => {
  const { c, events, ws } = await connected();
  ws.serverClose(1012);
  assert.equal(c.state, ConnState.ERROR);
  assert.deepEqual(events.errors, ["server_restarting"]);
});

test("close() during connect aborts quietly and never opens a late socket", async () => {
  let release;
  const slowFetch = () => new Promise((resolve) => (release = resolve));
  const { c, events } = client({ fetch: slowFetch });
  FakeSocket.last = null;
  const started = c.start(START);
  c.close();
  release({ ok: true, status: 200, json: async () => ({ ticket: "t", ws_path: "/api/voice/ws" }) });
  await assert.rejects(started, (e) => e.code === "aborted");
  assert.equal(FakeSocket.last, null);
  assert.deepEqual(events.errors, []);
  assert.equal(c.state, ConnState.IDLE);
});

test("reconnecting pauses uploads and fires callbacks", async () => {
  const events = [];
  const { c, ws } = await connected({
    onReconnecting: () => events.push("reconnecting"),
    onReconnected: () => events.push("reconnected"),
  });
  ws.serverJson({ type: "reconnecting" });
  assert.equal(c.reconnecting, true);
  c.sendAudio(new ArrayBuffer(8));
  assert.equal(ws.sent.length, 0, "no uploads while the server reconnects to Gemini");
  ws.serverJson({ type: "reconnected" });
  c.sendAudio(new ArrayBuffer(8));
  assert.equal(ws.sent.length, 1);
  assert.deepEqual(events, ["reconnecting", "reconnected"]);
  assert.equal(c.state, ConnState.CONNECTED);
});

test("backpressure: frames are dropped instead of queueing latency", async () => {
  const { c, ws } = await connected();
  ws.bufferedAmount = MAX_BUFFERED_BYTES + 1;
  c.sendAudio(new ArrayBuffer(8));
  assert.equal(ws.sent.length, 0);
  assert.equal(c.droppedFrames, 1);
  ws.bufferedAmount = 0;
  c.sendAudio(new ArrayBuffer(8));
  assert.equal(ws.sent.length, 1);
});

test("PCM16 conversion round-trips and clamps", () => {
  const pcm = floatTo16BitPCM(new Float32Array([0, 0.5, -0.5, 1, -1, 2, -2]));
  assert.deepEqual([...pcm], [0, 16383, -16384, 32767, -32768, 32767, -32768]);
  const back = pcm16ToFloat32(pcm.buffer);
  assert.ok(Math.abs(back[1] - 0.5) < 0.001 && back[4] === -1);
  assert.equal(pcm16ToFloat32(new ArrayBuffer(3)).length, 1); // odd trailing byte ignored
});
