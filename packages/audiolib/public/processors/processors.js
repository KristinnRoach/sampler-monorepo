var _ = Object.defineProperty;
var T = (i) => {
  throw TypeError(i);
};
var q = (i, t, e) => t in i ? _(i, t, { enumerable: !0, configurable: !0, writable: !0, value: e }) : i[t] = e;
var u = (i, t, e) => q(i, typeof t != "symbol" ? t + "" : t, e), W = (i, t, e) => t.has(i) || T("Cannot " + e);
var M = (i, t, e) => t.has(i) ? T("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(i) : t.set(i, e);
var m = (i, t, e) => (W(i, t, "access private method"), e);
function S(i) {
  return 440 * Math.pow(2, (i - 69) / 12);
}
function V(i, t = 0) {
  return t === 0 ? i : Math.tanh(i * (1 + t * 3));
}
function C(i, t) {
  return t * Math.sin(2 * Math.PI * i);
}
function A(i, t, e) {
  let s = i + t / e;
  return s >= 1 && (s -= Math.floor(s)), s;
}
class G extends AudioWorkletProcessor {
  constructor() {
    super();
    // Default values
    u(this, "frequency", 440);
    // A4 in Hz
    u(this, "amplitude", 0);
    // 0-1 range
    u(this, "phase", 0);
    u(this, "midiNote", 69);
    // A4
    u(this, "distortionAmount", 0);
    this.port.onmessage = this.handleMessage.bind(this);
  }
  handleMessage(e) {
    const { type: s, payload: a } = e.data;
    switch (s) {
      case "setNote":
        this.midiNote = a, this.frequency = S(this.midiNote);
        break;
      case "setVolume":
        this.amplitude = a;
        break;
      case "setDistortion":
        this.distortionAmount = a;
        break;
    }
    this.port.postMessage({
      type: "paramChanged",
      payload: { param: s, value: a }
    });
  }
  process(e, s, a) {
    const o = s[0];
    for (let r = 0; r < o.length; r++) {
      const n = o[r];
      for (let l = 0; l < n.length; l++) {
        const c = C(this.phase, this.amplitude);
        n[l] = V(c, this.distortionAmount), this.phase = A(this.phase, this.frequency, sampleRate);
      }
    }
    return !0;
  }
}
registerProcessor("test-oscillator", G);
class w extends AudioWorkletProcessor {
  // Default values
  constructor() {
    super(), this.frequency = 440, this.amplitude = 0, this.phase = 0, this.midiNote = 69, this.distortionAmount = 0, this.port.onmessage = this.handleMessage.bind(this);
  }
  handleMessage(t) {
    const { type: e, payload: s } = t.data;
    switch (e) {
      case "setNote":
        this.midiNote = s, this.frequency = S(this.midiNote);
        break;
      case "setVolume":
        this.amplitude = s;
        break;
      case "setDistortion":
        this.distortionAmount = s;
        break;
    }
    this.port.postMessage({
      type: "paramChanged",
      payload: { param: e, value: s }
    });
  }
  process(t, e, s) {
    const a = e[0];
    for (let o = 0; o < a.length; o++) {
      const r = a[o];
      for (let n = 0; n < r.length; n++) {
        const l = C(this.phase, this.amplitude);
        r[n] = V(l, this.distortionAmount), this.phase = A(this.phase, this.frequency, sampleRate);
      }
    }
    return !0;
  }
}
registerProcessor("js-test-oscillator", w);
class v {
  constructor() {
    this.clear();
  }
  clear() {
    this.startTime = null, this.stopTime = null, this.lengthInSeconds = null, this.offsetSeconds = 0, this.state = "idle";
  }
  start(t, e = 0, s = null) {
    this.startTime = t, this.offsetSeconds = e, this.stopTime = null, this.lengthInSeconds = s, this.state = "playing";
  }
  stop(t) {
    this.stopTime = t, this.state = "stopped";
  }
  isActive(t) {
    return !(!this.startTime || t < this.startTime || this.stopTime && t >= this.stopTime || this.lengthInSeconds && t >= this.startTime + this.lengthInSeconds);
  }
  shouldStop(t) {
    return this.startTime ? !!(this.stopTime && t >= this.stopTime || this.lengthInSeconds && t >= this.startTime + this.lengthInSeconds) : !1;
  }
  getPlaybackProgress(t) {
    return {
      currentTime: t,
      elapsedTime: t - this.startTime,
      playbackTime: t - this.startTime + this.offsetSeconds
    };
  }
}
const B = 0.05;
var p, L, d, x;
class D extends AudioWorkletProcessor {
  // #keyboardHandler;
  constructor() {
    super();
    M(this, p);
    this.buffer = null, this.playbackPosition = 0, this.loopCount = 0, this.timing = new v(), this.isPlaying = !1, this.isReleasing = !1, this.loopEnabled = !1, this.usePlaybackPosition = !1, this.port.onmessage = (e) => {
      const { type: s, value: a, buffer: o, startOffset: r, duration: n, when: l } = e.data;
      switch (s) {
        case "voice:init":
          this.timing = new v(), this.usePlaybackPosition = !1, this.loopEnabled = !1;
          break;
        case "voice:set_buffer":
          this.isPlaying = !1, this.timing.clear(), this.playbackPosition = 0, this.loopCount = 0, this.buffer = o;
          break;
        case "voice:start":
          this.isReleasing = !1, this.timing.start(l, r || 0, n), this.playbackPosition = (r || 0) * sampleRate, this.isPlaying = !0, this.port.postMessage({
            type: "voice:started",
            time: currentTime
          });
          break;
        case "voice:release":
          this.isReleasing = !0;
          break;
        case "voice:stop":
          this.timing.stop(currentTime), this.isPlaying = !1, this.isReleasing = !1;
          break;
        case "setLoopEnabled":
          this.loopEnabled = a;
          break;
        case "voice:usePlaybackPosition":
          this.usePlaybackPosition = a;
          break;
      }
    };
  }
  static get parameterDescriptors() {
    return [
      {
        name: "playbackPosition",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
      },
      {
        name: "envGain",
        defaultValue: 0,
        minValue: 0,
        maxValue: 1,
        automationRate: "k-rate"
      },
      {
        name: "velocity",
        defaultValue: 100,
        minValue: 0,
        maxValue: 127,
        automationRate: "k-rate"
      },
      {
        name: "playbackRate",
        defaultValue: 1,
        minValue: -4,
        maxValue: 4,
        automationRate: "a-rate"
      },
      {
        name: "loopStart",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
      },
      {
        name: "loopEnd",
        defaultValue: 0,
        minValue: 0,
        automationRate: "k-rate"
      }
    ];
  }
  process(e, s, a) {
    const o = s[0];
    if (!o || m(this, p, x).call(this, a))
      return m(this, p, d).call(this, o), !0;
    const r = a.playbackRate[0], n = a.loopStart[0] * sampleRate, l = a.loopEnd[0] * sampleRate, c = a.envGain[0], h = a.velocity[0], g = Math.min(o.length, this.buffer.length), f = this.buffer[0].length;
    if (!this.timing.isActive(currentTime))
      return console.error("timing not active"), m(this, p, d).call(this, o), !0;
    for (let y = 0; y < o[0].length; y++) {
      if (this.loopEnabled && this.playbackPosition >= l && (this.playbackPosition = n, this.loopCount++, this.port.postMessage({
        type: "voice:looped",
        loopCount: this.loopCount
      })), this.playbackPosition >= f) {
        if (!this.loopEnabled)
          return m(this, p, d).call(this, o), !0;
        this.playbackPosition = 0;
      }
      const P = Math.floor(this.playbackPosition), E = this.playbackPosition - P, I = Math.min(P + 1, f - 1);
      for (let b = 0; b < g; b++) {
        const k = this.buffer[Math.min(b, this.buffer.length - 1)], R = k[P], N = k[I];
        o[b][y] = (R + E * (N - R)) * h * c;
      }
      this.playbackPosition += r;
    }
    return this.usePlaybackPosition && this.port.postMessage({
      type: "voice:position",
      position: this.playbackPosition / sampleRate
      // seconds: playbackTime,
      // amplitude: output[0][output.length - 1],
    }), !0;
  }
}
p = new WeakSet(), // enableKeyboard() {
//   // if (!this.#keyboardHandler) {
//   // this.#keyboardHandler = {
//   //   onNoteOn: this.#onNoteOn.bind(this),
//   //   onNoteOff: this.#onNoteOff.bind(this),
//   //   // onBlur: this.#onBlur.bind(this),
//   // };
//   document.addEventListener('keydown', this.#onNoteOn);
//   document.addEventListener('keyup', this.#onNoteOff);
//   // } else {
//   //   console.debug(`keyboard already enabled`);
//   // }
// }
// disableKeyboard() {
//   // if (this.#keyboardHandler) {
//   //   globalKeyboardInput.removeHandler(this.#keyboardHandler);
//   //   this.#keyboardHandler = null;
//   // } else {
//   //   console.debug(`keyboard already disabled`);
//   // }
//   document.removeEventListener('keydown', this.#onNoteOn);
//   document.removeEventListener('keyup', this.#onNoteOff);
// }
// #onNoteOn(midiNote, velocity, modifiers) {
//   console.warn(`ON: ${(midinote, velocity, modifiers)}`);
//   this.isReleasing = false;
//   this.timing.start(currentTime, 0, null);
//   this.playbackPosition = 0;
//   this.isPlaying = true;
//   // this.port.postMessage({
//   //   type: 'voice:started',
//   //   time: currentTime,
//   // });
// }
// #onNoteOff(midiNote, modifiers) {
//   console.warn(`${(midinote, modifiers)}`);
//   this.isReleasing = true;
// }
L = function(e) {
  for (let s = 0; s < e.length; s++)
    e[s].fill(0);
}, d = function(e) {
  this.isPlaying = !1, this.isReleasing = !1, this.timing && this.timing.clear(), this.playbackPosition = 0, this.port.postMessage({ type: "voice:ended" });
}, x = function(e) {
  return !this.buffer || !this.buffer.length || !this.isPlaying || this.timing.shouldStop(currentTime) || this.isReleasing && e.envGain[0] <= B;
};
registerProcessor("sample-player-processor", D);
class O extends AudioWorkletProcessor {
  // Ratio for sample rate conversion
  constructor() {
    super();
    u(this, "buffer", null);
    u(this, "isPlaying", !1);
    u(this, "playbackPosition", 0);
    u(this, "gain", 1);
    u(this, "bufferSampleRate", 44100);
    // Default assumption
    u(this, "playbackRatio", 1.5);
    this.port.onmessage = this.handleMessage.bind(this);
  }
  handleMessage(e) {
    const { type: s, payload: a } = e.data;
    switch (s) {
      case "loadBuffer":
        this.buffer = a.buffer, this.playbackPosition = 0, a.sampleRate && (this.bufferSampleRate = a.sampleRate, this.playbackRatio = this.bufferSampleRate / sampleRate, console.log(
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
        this.isPlaying = !0, this.playbackPosition = (a == null ? void 0 : a.position) || 0;
        break;
      case "stop":
        this.isPlaying = !1, this.playbackPosition = 0;
        break;
      case "pause":
        this.isPlaying = !1;
        break;
      case "setVolume":
        this.gain = a;
        break;
    }
  }
  process(e, s, a) {
    if (!this.buffer || !this.isPlaying) {
      const n = s[0];
      for (let l = 0; l < n.length; l++) {
        const c = n[l];
        for (let h = 0; h < c.length; h++)
          c[h] = 0;
      }
      return !0;
    }
    const o = s[0], r = Math.min(this.buffer.length, o.length);
    for (let n = 0; n < r; n++) {
      const l = o[n], c = this.buffer[n];
      for (let h = 0; h < l.length; h++) {
        const g = this.playbackPosition + h * this.playbackRatio, f = Math.floor(g);
        f < c.length ? l[h] = c[f] * this.gain : (l[h] = 0, h === 0 && n === 0 && (this.playbackPosition = 0, this.isPlaying = !1, this.port.postMessage({ type: "playbackEnded" })));
      }
    }
    return this.isPlaying && (this.playbackPosition += o[0].length * this.playbackRatio), !0;
  }
}
registerProcessor("buffer-player", O);
export {
  A as advancePhase,
  C as generateSineWave,
  S as midiToFreq,
  V as softClip
};
