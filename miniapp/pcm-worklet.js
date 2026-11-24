// AudioWorklet: collects microphone samples and posts ~100 ms PCM16 chunks to the main thread.
// (Live API docs recommend ~100 ms chunks.) Kept dependency-free: worklet module imports are
// not reliable in every WebView.

class PcmCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = Math.round(sampleRate / 10);
    this.buffer = new Int16Array(this.chunkSize);
    this.length = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (channel) {
      for (let i = 0; i < channel.length; i++) {
        const s = Math.max(-1, Math.min(1, channel[i]));
        this.buffer[this.length++] = s < 0 ? s * 0x8000 : s * 0x7fff;
        if (this.length === this.chunkSize) {
          const chunk = this.buffer.slice(0).buffer;
          this.port.postMessage(chunk, [chunk]);
          this.length = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor("pcm-capture", PcmCaptureProcessor);
