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
  private _isLooping: boolean;
  private _loopMode: 'interactive' | 'always_on' | 'always_off';
  private _loopStart_seconds: number;
  private _loopEnd_seconds: number;
  private _loopGlide_seconds: number | null;

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

    this._isLooping = params?.loopMode === 'always_on' ? true : false;
    this._loopMode = params?.loopMode || 'interactive';
    this._loopStart_seconds = 0;
    this._loopEnd_seconds = buffer.duration || 0;
    this._loopGlide_seconds = 0;

    // One gain node per voice - allows for envelope / lfo per voice
    this._gainNode = this._context.createGain();
    this._gainNode.connect(this._context.destination);
    this._volume = params?.volume || 1;

    // Pre-create the next source node
    this._nextSource = this._createSourceNode();
  }

  private _createSourceNode(): AudioBufferSourceNode {
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
    this._isLooping = enabled;

    if (this._activeSource) {
      this._activeSource.loop = enabled;
    }

    if (this._nextSource) {
      this._nextSource.loop = enabled;
    }
  }

  setBuffer(buffer: AudioBuffer): void {
    this._buffer = buffer;
    this._nextSource = this._createSourceNode();
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
  ): void {
    if (!this._buffer) return;

    // Stop any current playback // needed?
    if (this._isPlaying && this._activeSource) {
      this.stop();
    }

    if (!this._portamento_seconds) {
      this._nextSource.playbackRate.value = playbackRate;
      // TODO: Implement amp envelope !
      this._nextSource.start();
    } else {
      this._nextSource.playbackRate.setValueAtTime(
        playbackRate,
        this._portamento_seconds
      );

      this._activeSource?.start(
        this._start_seconds,
        this._end_seconds - this._start_seconds
      );

      this._isPlaying = true;

      // TESTING: Use the pre-created source node to minimize latency and
      //          immediately create the next source node for next playback
      this._activeSource = this._nextSource;
      this._nextSource = this._createSourceNode();
    }
  }

  stop(): void {
    if (this._isPlaying && this._activeSource) {
      this._activeSource.stop(this._context.currentTime);

      // Disconnect to free resources
      this._activeSource = null;
      this._activeSource?.disconnect(); // needed?
      this._isPlaying = false;
    }
  }
  setLoopPoints(
    loopStart_ms: number,
    loopEnd_ms: number,
    interpolationTime_ms: number | null = null
  ): void {
    // Convert from ms to seconds at the public API boundary
    const loopStart = loopStart_ms / 1000;
    const loopEnd = loopEnd_ms / 1000;
    const interpolationTime =
      interpolationTime_ms !== null ? interpolationTime_ms / 1000 : null;

    this._loopGlide_seconds = interpolationTime;

    // If no interpolation or not playing/looping, update immediately
    if (
      !interpolationTime ||
      interpolationTime <= 0 ||
      !this._isPlaying ||
      !this._isLooping
    ) {
      this._loopStart_seconds = loopStart;
      this._loopEnd_seconds = loopEnd;

      if (this._activeSource) {
        this._activeSource.loopStart = loopStart;
        this._activeSource.loopEnd = loopEnd;
      }

      if (this._nextSource) {
        this._nextSource.loopStart = loopStart;
        this._nextSource.loopEnd = loopEnd;
      }
      return;
    }

    // Handle interpolation
    const startLoopStart = this._loopStart_seconds;
    const startLoopEnd = this._loopEnd_seconds;
    const interpolationStartTime = this._context.currentTime;
    let updateIntervalId: number;

    updateIntervalId = window.setInterval(() => {
      const now = this._context.currentTime;
      const elapsed = now - interpolationStartTime;
      const progress = Math.min(elapsed / interpolationTime!, 1.0);

      const currentLoopStart =
        startLoopStart + (loopStart - startLoopStart) * progress;
      const currentLoopEnd = startLoopEnd + (loopEnd - startLoopEnd) * progress;

      // Update current values
      this._loopStart_seconds = currentLoopStart;
      this._loopEnd_seconds = currentLoopEnd;

      if (this._activeSource) {
        this._activeSource.loopStart = currentLoopStart;
        this._activeSource.loopEnd = currentLoopEnd;
      }

      // Dispatch event for external listeners with values converted back to ms
      document.dispatchEvent(
        new CustomEvent('loopPointsInterpolated', {
          detail: {
            currentLoopStart_ms: currentLoopStart * 1000,
            currentLoopEnd_ms: currentLoopEnd * 1000,
            progress,
          },
        })
      );

      if (progress >= 1.0) {
        clearInterval(updateIntervalId);
      }
    }, 16.7);
  }
}
