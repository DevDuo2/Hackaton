// Run with: node --test "tests/js/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";

import { Microphone, MicState, classifyError, isSupported, queryPermission } from "../../miniapp/mic.js";

function fakeTrack() {
  return { stopped: false, enabled: true, stop() { this.stopped = true; }, addEventListener() {} };
}

function fakeStream() {
  const tracks = [fakeTrack()];
  return { tracks, getTracks: () => tracks, getAudioTracks: () => tracks };
}

function fakeEnv({ getUserMedia, permission, secure = true } = {}) {
  const calls = [];
  return {
    calls,
    isSecureContext: secure,
    navigator: {
      mediaDevices: getUserMedia
        ? {
            getUserMedia: (constraints) => {
              calls.push(constraints);
              return getUserMedia(constraints);
            },
          }
        : undefined,
      permissions: permission ? { query: async () => ({ state: permission }) } : undefined,
    },
  };
}

const domError = (name) => Object.assign(new Error(name), { name });

test("does not touch the microphone on construction", () => {
  const env = fakeEnv({ getUserMedia: async () => fakeStream() });
  const mic = new Microphone({ env });
  assert.equal(mic.state, MicState.IDLE);
  assert.equal(env.calls.length, 0);
});

test("unsupported when getUserMedia is missing or context is insecure", async () => {
  assert.equal(isSupported(fakeEnv()), false);
  assert.equal(isSupported(fakeEnv({ getUserMedia: async () => fakeStream(), secure: false })), false);

  const mic = new Microphone({ env: fakeEnv() });
  assert.equal(mic.state, MicState.UNSUPPORTED);
  assert.deepEqual(await mic.start(), { state: MicState.UNSUPPORTED });
});

test("start requests audio only and becomes active", async () => {
  const stream = fakeStream();
  const env = fakeEnv({ getUserMedia: async () => stream });
  const mic = new Microphone({ env });

  const result = await mic.start();

  assert.equal(result.state, MicState.ACTIVE);
  assert.equal(result.stream, stream);
  assert.equal(env.calls.length, 1);
  assert.equal(env.calls[0].video, false);
  assert.ok(env.calls[0].audio);
});

test("permission denial is reported, not thrown", async () => {
  const mic = new Microphone({ env: fakeEnv({ getUserMedia: async () => { throw domError("NotAllowedError"); } }) });
  const result = await mic.start();
  assert.equal(result.state, MicState.DENIED);
  assert.equal(mic.isActive, false);
});

test("classifies getUserMedia errors", () => {
  assert.equal(classifyError(domError("NotAllowedError")), MicState.DENIED);
  assert.equal(classifyError(domError("SecurityError")), MicState.DENIED);
  assert.equal(classifyError(domError("NotFoundError")), MicState.NO_DEVICE);
  assert.equal(classifyError(domError("NotReadableError")), MicState.BUSY);
  assert.equal(classifyError(domError("WeirdError")), MicState.ERROR);
  assert.equal(classifyError(undefined), MicState.ERROR);
});

test("stop releases every track and returns to idle", async () => {
  const stream = fakeStream();
  const mic = new Microphone({ env: fakeEnv({ getUserMedia: async () => stream }) });
  await mic.start();

  mic.stop();

  assert.ok(stream.tracks.every((t) => t.stopped));
  assert.equal(mic.state, MicState.IDLE);
  assert.equal(mic.stream, null);
  mic.stop(); // idempotent
});

test("stop during a pending permission prompt releases the late stream", async () => {
  const stream = fakeStream();
  let resolve;
  const mic = new Microphone({ env: fakeEnv({ getUserMedia: () => new Promise((r) => (resolve = r)) }) });

  const pending = mic.start();
  assert.equal(mic.state, MicState.REQUESTING);
  mic.stop();
  resolve(stream);
  await pending;

  assert.ok(stream.tracks[0].stopped);
  assert.equal(mic.isActive, false);
  assert.equal(mic.state, MicState.IDLE);
});

test("setMuted toggles track.enabled without releasing", async () => {
  const stream = fakeStream();
  const mic = new Microphone({ env: fakeEnv({ getUserMedia: async () => stream }) });
  await mic.start();

  mic.setMuted(true);
  assert.equal(stream.tracks[0].enabled, false);
  assert.equal(stream.tracks[0].stopped, false);
  mic.setMuted(false);
  assert.equal(stream.tracks[0].enabled, true);
});

test("queryPermission never prompts and falls back to unknown", async () => {
  assert.equal(await queryPermission(fakeEnv({ permission: "denied" })), "denied");
  assert.equal(await queryPermission(fakeEnv()), "unknown");
  const throwing = { navigator: { permissions: { query: async () => { throw new TypeError("unsupported"); } } } };
  assert.equal(await queryPermission(throwing), "unknown");
});
