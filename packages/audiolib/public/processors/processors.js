var y = Object.defineProperty;
var P = (s, e, a) => e in s ? y(s, e, { enumerable: !0, configurable: !0, writable: !0, value: a }) : s[e] = a;
var n = (s, e, a) => P(s, typeof e != "symbol" ? e + "" : e, a);
function f(s) {
  return 440 * Math.pow(2, (s - 69) / 12);
}
function d(s, e = 0) {
  return e === 0 ? s : Math.tanh(s * (1 + e * 3));
}
function m(s, e) {
  return e * Math.sin(2 * Math.PI * s);
}
function b(s, e, a) {
  let t = s + e / a;
  return t >= 1 && (t -= Math.floor(t)), t;
}
class k extends AudioWorkletProcessor {
  constructor() {
    super();
    // Default values
    n(this, "frequency", 440);
    // A4 in Hz
    n(this, "amplitude", 0);
    // 0-1 range
    n(this, "phase", 0);
    n(this, "midiNote", 69);
    // A4
    n(this, "distortionAmount", 0);
    this.port.onmessage = this.handleMessage.bind(this);
  }
  handleMessage(a) {
    const { type: t, payload: i } = a.data;
    switch (t) {
      case "setNote":
        this.midiNote = i, this.frequency = f(this.midiNote);
        break;
      case "setVolume":
        this.amplitude = i;
        break;
      case "setDistortion":
        this.distortionAmount = i;
        break;
    }
    this.port.postMessage({
      type: "paramChanged",
      payload: { param: t, value: i }
    });
  }
  process(a, t, i) {
    const h = t[0];
    for (let p = 0; p < h.length; p++) {
      const o = h[p];
      for (let r = 0; r < o.length; r++) {
        const u = m(this.phase, this.amplitude);
        o[r] = d(u, this.distortionAmount), this.phase = b(this.phase, this.frequency, sampleRate);
      }
    }
    return !0;
  }
}
registerProcessor("test-oscillator", k);
class M extends AudioWorkletProcessor {
  // Default values
  constructor() {
    super(), this.frequency = 440, this.amplitude = 0, this.phase = 0, this.midiNote = 69, this.distortionAmount = 0, this.port.onmessage = this.handleMessage.bind(this);
  }
  handleMessage(e) {
    const { type: a, payload: t } = e.data;
    switch (a) {
      case "setNote":
        this.midiNote = t, this.frequency = f(this.midiNote);
        break;
      case "setVolume":
        this.amplitude = t;
        break;
      case "setDistortion":
        this.distortionAmount = t;
        break;
    }
    this.port.postMessage({
      type: "paramChanged",
      payload: { param: a, value: t }
    });
  }
  process(e, a, t) {
    const i = a[0];
    for (let h = 0; h < i.length; h++) {
      const p = i[h];
      for (let o = 0; o < p.length; o++) {
        const r = m(this.phase, this.amplitude);
        p[o] = d(r, this.distortionAmount), this.phase = b(this.phase, this.frequency, sampleRate);
      }
    }
    return !0;
  }
}
registerProcessor("js-test-oscillator", M);
class R extends AudioWorkletProcessor {
  // Ratio for sample rate conversion
  constructor() {
    super();
    n(this, "buffer", null);
    n(this, "isPlaying", !1);
    n(this, "playbackPosition", 0);
    n(this, "gain", 1);
    n(this, "bufferSampleRate", 44100);
    // Default assumption
    n(this, "playbackRatio", 1.5);
    this.port.onmessage = this.handleMessage.bind(this);
  }
  handleMessage(a) {
    const { type: t, payload: i } = a.data;
    switch (t) {
      case "loadBuffer":
        this.buffer = i.buffer, this.playbackPosition = 0, i.sampleRate && (this.bufferSampleRate = i.sampleRate, this.playbackRatio = this.bufferSampleRate / sampleRate, console.log(
          `Buffer sample rate: ${this.bufferSampleRate}, AudioContext sample rate: ${sampleRate}, Ratio: ${this.playbackRatio}`
        )), this.buffer && this.buffer[0] && this.port.postMessage({
          type: "bufferLoaded",
          payload: {
            numChannels: this.buffer.length,
            length: this.buffer[0].length || 0
          }
        });
        break;
      case "play":
        this.isPlaying = !0, this.playbackPosition = (i == null ? void 0 : i.position) || 0;
        break;
      case "stop":
        this.isPlaying = !1, this.playbackPosition = 0;
        break;
      case "pause":
        this.isPlaying = !1;
        break;
      case "setVolume":
        this.gain = i;
        break;
    }
  }
  process(a, t, i) {
    if (!this.buffer || !this.isPlaying) {
      const o = t[0];
      for (let r = 0; r < o.length; r++) {
        const u = o[r];
        for (let l = 0; l < u.length; l++)
          u[l] = 0;
      }
      return !0;
    }
    const h = t[0], p = Math.min(this.buffer.length, h.length);
    for (let o = 0; o < p; o++) {
      const r = h[o], u = this.buffer[o];
      for (let l = 0; l < r.length; l++) {
        const g = this.playbackPosition + l * this.playbackRatio, c = Math.floor(g);
        c < u.length ? r[l] = u[c] * this.gain : (r[l] = 0, l === 0 && o === 0 && (this.playbackPosition = 0, this.isPlaying = !1, this.port.postMessage({ type: "playbackEnded" })));
      }
    }
    return this.isPlaying && (this.playbackPosition += h[0].length * this.playbackRatio), !0;
  }
}
registerProcessor("buffer-player", R);
export {
  b as advancePhase,
  m as generateSineWave,
  f as midiToFreq,
  d as softClip
};
