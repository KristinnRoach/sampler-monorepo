type VoiceParams = {
  basePlaybackRate: number;
  pitchGlide_ms: number;
  playbackDirection: 'forward' | 'reverse' | 'pingpong';

  start_ms: number;
  end_ms: number;

  loopMode: 'interactive' | 'always_on' | 'always_off';
  loopStart_ms: number;
  loopEnd_ms: number;
  loopGlide_ms: number | null;

  volume: number; // amplitude? (responds to MIDI velocity)
  pan?: number; // if instrument is stereo

  // AR or ADSR envelope
  attack_ms: number;
  decay_ms?: number;
  sustain?: number;
  release_ms: number;
};

type VoiceState = {
  isPlaying: boolean;
  playbackRate: number;
  playbackDirection: 'forward' | 'reverse' | 'pingpong';
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  volume: number;
  pan: number;
};

export class Voice {
  private _context: AudioContext;
  private _buffer: AudioBuffer;
  private _gainNode: GainNode;
  private _volume: number;

  private _basePlaybackRate: number;
  private _playbackRate: number;
  private _pitchGlide_seconds: number;
  private _portamento_seconds: number;
  private _playbackDirection: 'forward' | 'reverse' | 'pingpong';

  private _start_seconds: number;
  private _end_seconds: number;

  private _isPlaying: boolean;
  private _loopEnabled: boolean;
  private _loopMode: 'interactive' | 'always_on' | 'always_off';
  private _loopStart_seconds: number;
  private _loopEnd_seconds: number;
  private _loopLerp_seconds: number | null;

  // TESTING: Pre-create the next source node to eliminate creation latency during playback
  private _activeSource: AudioBufferSourceNode | null;
  private _nextSource: AudioBufferSourceNode | null;

  constructor(
    context: AudioContext,
    buffer: AudioBuffer,
    params: Partial<VoiceParams> | VoiceParams | null = null
  ) {
    this._context = context;
    this._buffer = buffer;
    this._activeSource = null;

    this._isPlaying = false;
    this._basePlaybackRate = params?.basePlaybackRate || 1;
    this._playbackRate = this._basePlaybackRate;
    this._pitchGlide_seconds = params?.pitchGlide_ms / 1000 || 0;
    this._playbackDirection = params?.playbackDirection || 'forward';

    this._loopEnabled = params?.loopMode === 'always_on' ? true : false;
    this._loopMode = params?.loopMode || 'interactive';
    this._loopStart_seconds = 0;
    this._loopEnd_seconds = buffer.duration || 0;
    this._loopLerp_seconds = 0;

    // One gain node per voice - allows for envelope / lfo per voice
    this._gainNode = this._context.createGain();
    this._gainNode.connect(this._context.destination);
    this._volume = params?.volume || 1;

    // Pre-create the next source node
    this._nextSource = this._createNextSource(buffer);
  }

  private _createNextSource(buffer: AudioBuffer): AudioBufferSourceNode {
    const source = this._context.createBufferSource();
    source.connect(this._gainNode);

    // If we already have a buffer, set it on the source
    if (this._buffer) {
      source.buffer = this._buffer;

      // Apply loop settings if they exist
      if (this._loopEnd_seconds > 0) {
        source.loop = true;
        source.loopStart = this._loopStart_seconds;
        source.loopEnd = this._loopEnd_seconds;
      }
    }

    return source;
  }

  // TODO: Extend EventTarget instead of using getters
  // temp:
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /* SETTERS */

  set loopEnabled(enabled: boolean) {
    this._loopEnabled = enabled;

    if (this._activeSource) {
      this._activeSource.loop = enabled;
    }

    if (this._nextSource) {
      this._nextSource.loop = enabled;
    }
  }

  set loopGlide(milliseconds: number) {
    this._loopLerp_seconds = milliseconds / 1000;
  }

  setBuffer(buffer: AudioBuffer): void {
    this._activeSource?.stop();
    this._activeSource = null;
    this._nextSource?.stop();
    this._nextSource = null;
    // TODO: Disconnect old buffer? Clean up?
    this._buffer = buffer;
    // Todo: validate buffer
    this._nextSource = this._createNextSource(buffer);
  }

  setVolume(value: number, time: number = 0.05): void {
    this._gainNode.gain.setValueAtTime(value, time);
  }

  setPlaybackRate(
    rate: number,
    glideMS: number = this._pitchGlide_seconds / 1000
  ): void {
    // TODO: Test pitch glide changes when triggering new notes
    // TODO: Portamento for non-legato / non-looping notes
    this._playbackRate = rate;
    this._activeSource?.playbackRate.setValueAtTime(rate, glideMS);
    this._nextSource?.playbackRate.setValueAtTime(rate, glideMS);
  }

  setPitchGlide(milliseconds: number): void {
    this._pitchGlide_seconds = milliseconds / 1000;
  }

  setPlaybackDirection(direction: 'forward' | 'reverse' | 'pingpong'): void {
    // TODO: Implement / test playback direction
    this._playbackDirection = direction;
    this._playbackRate = -this._playbackRate;
  }

  setPortamentoMS(milliseconds: number) {
    this._portamento_seconds = milliseconds / 1000;
  }

  play(
    playbackRate: number = 1,
    velocity?: number,
    params?: Partial<VoiceParams>
  ) {
    if (!this._nextSource || this._isPlaying) {
      throw new Error('No source node available to play');
    }

    if (!this._portamento_seconds) {
      this._nextSource.playbackRate.value = playbackRate;
    } else {
      this._nextSource.playbackRate.setValueAtTime(
        playbackRate,
        this._portamento_seconds
      );
    }

    this._nextSource.start(
      this._start_seconds,
      this._end_seconds - this._start_seconds
    );

    this._isPlaying = true;

    this._activeSource = this._nextSource;
    this._nextSource = this._createNextSource(this._buffer);
  }

  stop(): void {
    this._activeSource.stop();
    this._activeSource = null;
    this._isPlaying = false;
  }

  // Todo: change to setLoopPoint(value_ms: number, param: loopStart | loopEnd), since only one is changed at a time
  // Todo: System to consistently convert all params ms to seconds in one place, since WebAudio APi uses seconds

  // Linear interpolation
  lerp(start: number, end: number, mix: number): number {
    return start + (end - start) * mix;
  }

  setLoopPoint(
    targetValue_ms: number,
    param: 'loopStart' | 'loopEnd',
    lerpDuration_ms: number = this._loopLerp_seconds * 1000
  ): void {
    if (!(this._activeSource || this._nextSource)) {
      throw new Error('No source node available to set loop point');
    }

    // convert params from ms to seconds
    const targetSec = targetValue_ms / 1000;
    const lerpSeconds = lerpDuration_ms / 1000;

    // If not playing/looping, update immediately
    if (!this._isPlaying || !this._loopEnabled) {
      this._loopStart_seconds = targetSec;

      if (this._activeSource) {
        this._activeSource.loopStart = targetSec;
      }

      if (this._nextSource) {
        this._nextSource.loopStart = targetSec;
      }
      return;
    }

    // get current time and calculate end time for interpolation
    const startLerpSec = this._context.currentTime;
    const endLerpSec = startLerpSec + lerpSeconds;

    // Handle interpolation
    const prevValue =
      param == 'loopStart' ? this._loopStart_seconds : this._loopEnd_seconds;

    function update() {
      const now = this._context.currentTime;

      if (now >= endLerpSec) {
        // Ensure the final value is set precisely
        this._activeSource[param] = targetSec;
        return;
      }

      // Calculate interpolation factor (t)
      const t = (now - startLerpSec) / lerpSeconds;

      // Interpolate values using lerp
      this._activeSource[param] = this.lerp(prevValue, targetSec, t);
      this._nextSource[param] = this.lerp(prevValue, targetSec, t);

      // Schedule next update
      setTimeout(update, 1); // High-resolution (~1ms)
    }

    // Start the first update
    update();
  }
}

// setLoopPoints(loopStart_ms: number, loopEnd_ms: number): void {
//   // Todo: change to setLoopPoint(value_ms: number, param: loopStart | loopEnd), since only one is changed at a time
//   // Todo: System to consistently convert all params ms to seconds in one place, since WebAudio APi uses seconds
//   const targetStartSec = loopStart_ms / 1000;
//   const targetEndSec = loopEnd_ms / 1000;
//   const glideSec = this._loopGlide_seconds;

//   // If not playing/looping, update immediately
//   if (!this._isPlaying || !this._isLooping) {
//     this._loopStart_seconds = targetStartSec;
//     this._loopEnd_seconds = targetEndSec;

//     if (this._activeSource) {
//       this._activeSource.loopStart = targetStartSec;
//       this._activeSource.loopEnd = targetEndSec;
//     }

//     if (this._nextSource) {
//       this._nextSource.loopStart = targetStartSec;
//       this._nextSource.loopEnd = targetEndSec;
//     }
//     return;
//   }

//   // Handle interpolation
//   const prevLoopStart = this._loopStart_seconds;
//   const prevLoopEnd = this._loopEnd_seconds;
//   const glideStartTime = this._context.currentTime;

//   let updateIntervalId: number;
//   updateIntervalId = window.setInterval(() => {
//     const now = this._context.currentTime;
//     const elapsed = now - glideStartTime;
//     const progress = Math.min(elapsed / glideSec, 1.0);

//     const currentLoopStart =
//       prevLoopStart + (targetStartSec - prevLoopStart) * progress;
//     const currentLoopEnd =
//       prevLoopEnd + (targetEndSec - prevLoopEnd) * progress;

//     // Update current values
//     this._loopStart_seconds = currentLoopStart;
//     this._loopEnd_seconds = currentLoopEnd;

//     if (this._activeSource) {
//       this._activeSource.loopStart = currentLoopStart;
//       this._activeSource.loopEnd = currentLoopEnd;
//     }

//     // Dispatch event for external listeners with values converted back to ms
//     document.dispatchEvent(
//       new CustomEvent('loopPointsInterpolated', {
//         detail: {
//           currentLoopStart_ms: currentLoopStart * 1000,
//           currentLoopEnd_ms: currentLoopEnd * 1000,
//           progress,
//         },
//       })
//     );

//     if (progress >= 1.0) {
//       clearInterval(updateIntervalId);
//     }
//   }, 16.7);
// }

// export function interpolate(
//   startValue: number,
//   endValue: number,
//   durationSeconds: number,
//   onUpdate: (currentValue: number, progress: number) => void
// ): void {
//   if (durationSeconds <= 0) {
//     onUpdate(endValue, 1);
//     return;
//   }

//   const startTime = this._context.currentTime;
//   const intervalId = window.setInterval(() => {
//     const elapsed = this._context.currentTime - startTime;
//     const progress = Math.min(elapsed / durationSeconds, 1.0);
//     const currentValue = startValue + (endValue - startValue) * progress;

//     onUpdate(currentValue, progress);

//     if (progress >= 1.0) {
//       clearInterval(intervalId);
//     }
//   }, 16.7);
// }

// Example usage
// const audioContext = new AudioContext();
// const bufferSource = audioContext.createBufferSource();
// bufferSource.buffer = someAudioBuffer; // Load your buffer here

// // Interpolate loop points from 0 to 2 seconds over 5 seconds
// interpolateLoopPoints(audioContext, bufferSource, 0, 2, 5);

// bufferSource.loop = true;
// bufferSource.start();
