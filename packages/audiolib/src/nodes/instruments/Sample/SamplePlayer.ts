import { getAudioContext } from '@/context';
import { MidiController, globalKeyboardInput, PressedModifiers } from '@/io';
import { Message, MessageHandler, MessageBus } from '@/events';
import { detectSinglePitchAC } from '@/utils/pitchDetection';
import { findClosestNote } from '@/utils';

import {
  assert,
  tryCatch,
  isValidAudioBuffer,
  isMidiValue,
  findZeroCrossings,
} from '@/utils';

import {
  MacroParam,
  LibParamDescriptor,
  DEFAULT_PARAM_DESCRIPTORS,
  NormalizeOptions,
} from '@/nodes/params';

import { LibInstrument } from '@/nodes/instruments/LibInstrument';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';
import { SampleVoicePool } from './SampleVoicePool';
import { CustomEnvelope } from '@/nodes/params';
import { EnvelopeType } from '@/nodes/params/envelopes';

export class SamplePlayer extends LibInstrument {
  #bufferDuration: number = 0;
  #loopEnabled = false;
  #loopLocked = false;
  #holdEnabled = false;
  #holdLocked = false;

  #macroLoopStart: MacroParam;
  #macroLoopEnd: MacroParam;
  // #loopEndEnvelope: CustomEnvelope;

  #isReady = false;
  #isLoaded = false;
  #zeroCrossings: number[] = [];
  #useZeroCrossings = true;
  randomizeVelocity = false;

  voicePool: SampleVoicePool;

  connectAltOut: InstrumentMasterBus['connectAltOut'];
  setAltOutVolume: InstrumentMasterBus['setAltOutVolume'];
  mute: InstrumentMasterBus['mute'];

  constructor(
    context: AudioContext,
    polyphony: number = 16,
    audioBuffer?: AudioBuffer,
    midiController?: MidiController
  ) {
    super('sample-player', context, polyphony, audioBuffer, midiController);

    // Initialize voice pool
    this.voicePool = new SampleVoicePool(
      context,
      polyphony,
      this.outBus.input, // todo: explicit connect (first create generic pool interface)
      true // enable voice filters (lpf and hpf)
    );

    this.#setupMessageHandling();

    // Setup params
    this.#macroLoopStart = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_START
    );

    this.#macroLoopEnd = new MacroParam(
      context,
      DEFAULT_PARAM_DESCRIPTORS.LOOP_END
    );

    this.#connectVoicesToMacros(); // !! Disconnect IF using voice period quantization

    // Connect audiochain -- todo after generalizing voice pool

    // Initialize the output bus methods
    this.setAltOutVolume = (...args) => this.outBus.setAltOutVolume(...args);
    this.connectAltOut = (...args) => this.outBus.connectAltOut(...args);
    this.mute = (...args) => this.outBus.mute(...args);

    this.#isReady = true;

    if (audioBuffer?.duration) {
      this.loadSample(audioBuffer, audioBuffer.sampleRate);
    } else {
      this.#isLoaded = false;
    }
  }

  /* === MESSAGES === */

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  protected sendUpstreamMessage(type: string, data: any) {
    this.messages.sendMessage(type, data);
    return this;
  }

  #setupMessageHandling(): this {
    // Forward voice pool messages upstream
    this.messages.forwardFrom(this.voicePool, [
      'voice:started',
      'voice:stopped',
      'voice:releasing',
      'sample:loaded',
      'sample-envelopes:trigger',
      'sample-envelopes:duration',
    ]);

    return this;
  }

  getMacrosAudioParam(paramName: 'loopStart' | 'loopEnd') {
    switch (paramName) {
      case 'loopStart':
        return this.#macroLoopStart.audioParam;
      case 'loopEnd':
        return this.#macroLoopEnd.audioParam;

      default:
        const unreachable: never = paramName;
        throw new Error(`Unknown macro parameter: ${unreachable}`);
    }
  }

  getMacro(paramName: 'loopStart' | 'loopEnd') {
    switch (paramName) {
      case 'loopStart':
        return this.#macroLoopStart;
      case 'loopEnd':
        return this.#macroLoopEnd;

      default:
        const unreachable: never = paramName;
        throw new Error(`Unknown macro parameter: ${unreachable}`);
    }
  }

  #connectVoicesToMacros(): this {
    const voices = this.voicePool.allVoices;

    voices.forEach((voice, index) => {
      const loopStartParam = voice.getParam('loopStart');
      const loopEndParam = voice.getParam('loopEnd');

      if (loopStartParam) {
        this.#macroLoopStart.addTarget(loopStartParam, 'loopStart');
      } else {
        console.error('loopStart param is null!');
      }

      if (loopEndParam) {
        this.#macroLoopEnd.addTarget(loopEndParam, 'loopEnd');
      } else {
        console.error('loopEnd param is null!');
      }
    });

    return this;
  }

  #resetMacros(bufferDuration: number = this.#bufferDuration) {
    const normalizedLoopEnd = 1;
    const normalizedLoopStart = 0;

    this.#macroLoopEnd.audioParam.setValueAtTime(normalizedLoopEnd, this.now);
    this.#macroLoopStart.audioParam.setValueAtTime(
      normalizedLoopStart,
      this.now
    );

    const normalizeOptions: NormalizeOptions = {
      from: [0, bufferDuration],
      to: [0, 1],
    };

    this.setScale('C', [0], {
      lowestOctave: 0,
      highestOctave: 5,
      normalize: normalizeOptions,
    });

    return this;
  }

  async loadSample(
    buffer: AudioBuffer | ArrayBuffer,
    modSampleRate?: number,
    shoulDetectPitch = true,
    autoTranspose = true
  ): Promise<number> {
    if (buffer instanceof ArrayBuffer) {
      const ctx = getAudioContext();
      buffer = await ctx.decodeAudioData(buffer);
    }

    assert(isValidAudioBuffer(buffer));

    this.releaseAll(0);
    this.voicePool.transposeSemitones = 0; // or stored val
    this.#isLoaded = false;

    if (
      buffer.sampleRate !== this.audioContext.sampleRate ||
      (modSampleRate && this.audioContext.sampleRate !== modSampleRate)
    ) {
      console.warn(
        `sample rate mismatch, 
        buffer rate: ${buffer.sampleRate}, 
        context rate: ${this.audioContext.sampleRate}
        requested rate: ${modSampleRate}
        `
      );
    }

    if (shoulDetectPitch) {
      const pitchSource = await detectSinglePitchAC(buffer);
      // const pitchSource = await detectPitchWindowed(buffer);
      const targetNoteInfo = findClosestNote(pitchSource.frequency);

      const midiFloat = 69 + 12 * Math.log2(pitchSource.frequency / 440);
      const playbackRateMultiplier =
        targetNoteInfo.frequency / pitchSource.frequency;

      console.table({
        pitchSource,
        targetNoteInfo,
        playbackRateMultiplier,
        midiFloat,
      });

      this.sendUpstreamMessage('sample:pitch-detected', {
        pitchResults: pitchSource,
        closestNoteInfo: targetNoteInfo,
      });

      if (autoTranspose) {
        // ! Increase min confidence if getting many bad results
        if (pitchSource.confidence > 0.35) {
          let transposeSemitones = 60 - midiFloat;
          // Wrap to nearest octave (-6 to +6 semitones)
          while (transposeSemitones > 6) transposeSemitones -= 12;
          while (transposeSemitones < -6) transposeSemitones += 12;
          this.voicePool.transposeSemitones = transposeSemitones;

          console.info(`transposing by ${transposeSemitones} semitones`);

          this.sendUpstreamMessage('sample:auto-transpose', {
            didTranspose: true,
            pitchResults: pitchSource,
          });
        } else {
          console.info(`Skipped auto transpose due to unreliable results: `, {
            pitchResults: pitchSource,
          });

          this.sendUpstreamMessage('sample:auto-transpose', {
            didTranspose: false,
            pitchResults: pitchSource,
          });
        }
      }
    }

    if (this.#useZeroCrossings) {
      const zeroes = findZeroCrossings(buffer);
      this.#zeroCrossings = zeroes;
    }

    this.voicePool.setBuffer(buffer, this.#zeroCrossings);
    this.#bufferDuration = buffer.duration;

    this.#resetMacros(buffer.duration);

    // this.#isLoaded = true; // Sent via message when all voices loaded

    return buffer.duration;
  }

  play(
    midiNote: MidiValue,
    velocity: MidiValue = 100,
    modifiers?: PressedModifiers
  ): MidiValue | null {
    if (modifiers) {
      this.#handleModifierKeys(modifiers);
      if (modifiers.alt) midiNote += 12;
    }

    const safeVelocity = isMidiValue(velocity) ? velocity : 100;

    return this.voicePool.noteOn(
      midiNote,
      safeVelocity,
      0 // zero delay
    );

    // if (this.#loopEnabled) {
    //   const baseLoopEnd = this.getStoredParamValue('loopEnd', 1.0);
    //   // this.#macroLoopEnd.audioParam.cancelScheduledValues(this.now);
    //   // this.#macroLoopEnd.audioParam.setValueAtTime(baseLoopEnd, this.now); // ! this causes "overlap" scheduling error
    //   const minLoopEnd = this.loopStart + 0.01;

    //   this.#loopEndEnvelope.applyToAudioParam(
    //     this.#macroLoopEnd.audioParam,
    //     this.now,
    //     this.#bufferDuration,
    //     {
    //       baseValue: baseLoopEnd,
    //       minValue: minLoopEnd,
    //       maxValue: this.#bufferDuration,
    //     }
    //   );
    // }
  }

  release(midiNote: MidiValue, modifiers?: PressedModifiers): this {
    if (modifiers) this.#handleModifierKeys(modifiers);

    if (this.holdEnabled || this.#holdLocked) return this; // one-shot mode

    this.voicePool.noteOff(midiNote, this.getReleaseTime(), 0);

    this.sendUpstreamMessage('note:off', { midiNote });
    return this;
  }

  releaseAll(fadeOut_sec: number = this.getReleaseTime()): this {
    this.voicePool.allNotesOff(fadeOut_sec);
    return this;
  }

  panic = (fadeOut_sec?: number) => {
    this.releaseAll(fadeOut_sec);
    return this;
  };

  #handleModifierKeys(modifiers: PressedModifiers) {
    if (modifiers.caps !== undefined) {
      this.setLoopEnabled(modifiers.caps);
    }
    if (modifiers.shift !== undefined) {
      this.setHoldEnabled(modifiers.shift);
    }
    return this;
  }

  enableKeyboard() {
    if (!this.keyboardHandler) {
      this.keyboardHandler = {
        onNoteOn: this.play.bind(this),
        onNoteOff: this.release.bind(this),
        onBlur: () => this.panic(),
        onModifierChange: this.#handleModifierKeys.bind(this),
      };
      globalKeyboardInput.addHandler(this.keyboardHandler);
    }
    return this;
  }

  disableKeyboard() {
    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    }
    return this;
  }

  async initMidiController(): Promise<boolean> {
    if (this.midiController?.isInitialized) {
      return true;
    }

    if (!this.midiController) {
      this.midiController = new MidiController();
    }

    assert(
      this.midiController,
      `SamplePlayer: Failed to create MIDI controller`
    );

    const result = await tryCatch(() => this.midiController!.initialize());
    assert(!result.error, `SamplePlayer: Failed to initialize MIDI`);
    return result.data;
  }

  async enableMIDI(
    midiController?: MidiController,
    channel: number = 0
  ): Promise<this> {
    const controller = midiController || this.midiController;
    const midiSuccess = await this.initMidiController(); // move ?

    if (midiSuccess && controller?.isInitialized) {
      controller.connectInstrument(this, channel);
    }
    return this;
  }

  disableMIDI(midiController?: MidiController, channel: number = 0): this {
    const controller = midiController || this.midiController;
    if (controller) controller.disconnectInstrument(channel);
    return this;
  }

  setMidiController(midiController: MidiController): this {
    this.midiController = midiController;
    return this;
  }

  /** PARAM SETTERS  */

  setAttackTime(seconds: number): this {
    this.storeParamValue('attack', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setAttack(seconds));
    return this;
  }

  setReleaseTime(seconds: number): this {
    this.storeParamValue('release', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setRelease(seconds));
    return this;
  }

  setSampleStartPoint(seconds: number): this {
    this.storeParamValue('startPoint', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setStartPoint(seconds));
    return this;
  }

  setSampleEndPoint(seconds: number): this {
    this.storeParamValue('endPoint', seconds);
    this.voicePool.applyToAllVoices((voice) => voice.setEndPoint(seconds));
    return this;
  }

  setLoopRampDuration(seconds: number): this {
    this.storeParamValue('loopRampDuration', seconds);
    // ? todo: is this enough ?
    return this;
  }

  setPlaybackRate(value: number): this {
    this.storeParamValue('playbackRate', value);
    this.voicePool.applyToAllVoices((voice) => voice.setPlaybackRate(value));
    console.warn(`SamplePlayer: setPlaybackRate is not implemented yet.`);
    return this;
  }

  setLoopEnabled(enabled: boolean): this {
    if (this.#loopEnabled === enabled) return this;

    // if loop is locked (ON), turning it off is disabled but turning it on should work
    if (this.#loopLocked && !enabled) return this;

    const voices = this.voicePool.allVoices;
    voices.forEach((v) => v.setLoopEnabled(enabled));
    this.#loopEnabled = enabled;

    this.sendUpstreamMessage('loop:enabled', { enabled });

    return this;
  }

  setHoldEnabled(enabled: boolean) {
    if (this.#holdEnabled === enabled) return this;
    // if hold is locked (ON), turning it off is disabled but turning it on should work
    if (this.#holdLocked && !enabled) return this;
    this.#holdEnabled = enabled;
    if (!enabled) this.releaseAll(this.getReleaseTime());
    this.sendUpstreamMessage('hold:enabled', { enabled });

    return this;
  }

  setLoopLocked(locked: boolean): this {
    if (this.#loopLocked === locked) return this;

    this.#loopLocked = locked;

    this.setLoopEnabled(locked);
    this.sendUpstreamMessage('loop:locked', { locked });
    return this;
  }

  setHoldLocked(locked: boolean): this {
    if (this.#holdLocked === locked) return this;

    this.#holdLocked = locked;
    if (locked === false) this.releaseAll();

    console.debug(`sending hold:locked message, locked: ${locked}`);
    this.sendUpstreamMessage('hold:locked', { locked });
    return this;
  }

  // setLoopStart(
  //   targetValue: number,
  //   rampTime: number = this.getLoopRampDuration()
  // ) {
  //   console.debug(
  //     'setLoopStart, targetValue: ',
  //     targetValue,
  //     ' loopEnd: ',
  //     this.loopEnd
  //   );
  //   this.setLoopPoint('start', targetValue, this.loopEnd, rampTime);
  //   return this;
  // }

  // setLoopEnd(
  //   targetValue: number,
  //   rampTime: number = this.getLoopRampDuration()
  // ) {
  //   console.debug(
  //     'setLoopEnd, targetValue: ',
  //     targetValue,
  //     ' loopStart: ',
  //     this.loopEnd
  //   );
  //   this.setLoopPoint('end', this.loopStart, targetValue, rampTime);
  //   return this;
  // }

  setLoopStart(
    targetValue: number,
    rampTime: number = this.getLoopRampDuration()
  ) {
    const currentLoopEnd = this.loopEnd;

    console.debug(
      'setLoopStart, targetValue: ',
      targetValue,
      ' loopEnd: ',
      currentLoopEnd
    );

    this.#macroLoopStart.ramp(
      targetValue,
      rampTime,
      currentLoopEnd, // constant = the other loop point
      {
        onComplete: () => this.storeParamValue('loopStart', targetValue),
      }
    );
    return this;
  }

  setLoopEnd(
    targetValue: number,
    rampTime: number = this.getLoopRampDuration()
  ) {
    const currentLoopStart = this.loopStart;

    this.#macroLoopEnd.ramp(
      targetValue,
      rampTime,
      currentLoopStart, // constant = the other loop point
      {
        onComplete: () => this.storeParamValue('loopEnd', targetValue),
      }
    );
    return this;
  }

  isNormalized(value: number, range = [0, 1]): boolean {
    return value >= range[0] && value <= range[1];
  }

  readonly MIN_LOOP_DURATION_SECONDS = 1 / 1046.502; // C5 = 523.25 Hz, C6 = 1046.502

  #getMinLoopDurationNormalized = () =>
    this.MIN_LOOP_DURATION_SECONDS / this.#bufferDuration;

  #scaleLoopPoint(
    valueToAdjust: 'start' | 'end',
    start: number,
    end: number
  ): number {
    // Calculate scaling factor based on proposed loop size
    const proposedLoopSize = Math.abs(end - start);
    const scalingFactor = Math.max(1, 1 / (proposedLoopSize + 0.1));

    if (valueToAdjust === 'start') return Math.pow(start, scalingFactor);
    else return Math.pow(end, scalingFactor);
  }

  setLoopPoint(
    loopPoint: 'start' | 'end',
    normalizedLoopStart: number,
    normalizedLoopEnd: number,
    rampDuration: number = this.getLoopRampDuration()
  ) {
    // Validate input range
    if (
      !this.isNormalized(normalizedLoopStart) ||
      !this.isNormalized(normalizedLoopEnd)
    ) {
      console.error(
        `samplePlayer.setLoopPoint: Loop points must be in range 0-1`
      );
      return this;
    }

    // Scale and validate
    const scaledPoint = this.#scaleLoopPoint(
      loopPoint,
      normalizedLoopStart,
      normalizedLoopEnd
    );

    const RAMP_SENSITIVITY = 2;
    const scaledRampTime = rampDuration * RAMP_SENSITIVITY;

    // this.voicePool.applyToAllVoices((voice) => {
    //   voice.setLoopPoints(scaledStart, scaledEnd, scaledRampTime);
    // });

    if (loopPoint === 'start') {
      // && normalizedLoopStart !== this.loopStart) {
      // const storeLoopStart = () =>
      //   this.storeParamValue('loopStart', scaledPoint);

      // console.debug(
      //   `Ramping to loopStart, targetValue:  ${scaledPoint}, loopEnd (constant): ${normalizedLoopEnd}`
      // );

      this.#macroLoopStart.ramp(
        normalizedLoopStart,
        scaledRampTime,
        normalizedLoopEnd,
        {
          // onComplete: storeLoopStart,
        }
      );
    } else if (loopPoint === 'end') {
      // && normalizedLoopEnd !== this.loopEnd) {
      // const storeLoopEnd = () => this.storeParamValue('loopEnd', scaledPoint);
      this.#macroLoopEnd.ramp(
        normalizedLoopEnd,
        scaledRampTime,
        normalizedLoopStart,
        {
          // onComplete: storeLoopEnd,
        }
      );
    }

    return this;
  }

  /** PARAM GETTERS  */

  getAttackTime(): number {
    return this.getStoredParamValue(
      'attack',
      DEFAULT_PARAM_DESCRIPTORS.ATTACK.defaultValue
    );
  }

  getReleaseTime(): number {
    return this.getStoredParamValue(
      'release',
      DEFAULT_PARAM_DESCRIPTORS.RELEASE.defaultValue
    );
  }

  getStartPoint(): number {
    return this.getStoredParamValue(
      'startPoint',
      DEFAULT_PARAM_DESCRIPTORS.START_POINT.defaultValue
    );
  }

  getEndPoint(): number {
    return this.getStoredParamValue(
      'endPoint',
      DEFAULT_PARAM_DESCRIPTORS.END_POINT.defaultValue
    );
  }

  getLoopRampDuration(): number {
    return this.getStoredParamValue(
      'loopRampDuration',
      DEFAULT_PARAM_DESCRIPTORS.LOOP_RAMP_DURATION.defaultValue
    );
  }

  getPlaybackRate(): number {
    return this.getStoredParamValue(
      'playbackRate',
      DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE.defaultValue
    );
  }

  getHpfCutoff = () => this.getStoredParamValue('hpfCutoff', NaN);
  getLpfCutoff = () => this.getStoredParamValue('lpfCutoff', NaN);

  // Expose envelopes for UI access

  getEnvelope(envType: EnvelopeType): CustomEnvelope {
    // if (envType === 'loop-env') return this.#loopEndEnvelope; // Applied to macro

    // Return the first voice's envelope as the "master" envelope
    const firstVoice = this.voicePool.allVoices[0];
    return firstVoice!.getEnvelope(envType)!; // !
  }

  setEnvelopeLoop = (
    envType: EnvelopeType,
    loop: boolean,
    mode: 'normal' | 'ping-pong' | 'reverse' = 'normal'
  ) => {
    if (envType === 'loop-env') {
      // this.#loopEndEnvelope.setLoopEnabled(loop, mode);
    } else {
      this.voicePool.applyToAllVoices((v) =>
        v.setEnvelopeLoop(envType, loop, mode)
      );
    }
  };

  updateEnvelopePoint(
    envType: EnvelopeType,
    index: number,
    time: number,
    value: number
  ): void {
    if (envType === 'loop-env') {
      // this.#loopEndEnvelope.updatePoint(index, time, value);
    } else {
      this.voicePool.applyToAllVoices((v) =>
        v.updateEnvelopePoint(envType, index, time, value)
      );
    }
  }

  addEnvelopePoint(envType: EnvelopeType, time: number, value: number): void {
    if (envType === 'loop-env') {
      // this.#loopEndEnvelope.addPoint(time, value);
    } else {
      this.voicePool.applyToAllVoices((v) =>
        v.addEnvelopePoint(envType, time, value)
      );
    }
  }

  deleteEnvelopePoint(envType: EnvelopeType, index: number): void {
    if (envType === 'loop-env') {
      // this.#loopEndEnvelope.deletePoint(index);
    } else {
      this.voicePool.applyToAllVoices((v) =>
        v.deleteEnvelopePoint(envType, index)
      );
    }
  }

  startLevelMonitoring(intervalMs?: number) {
    this.outBus.startLevelMonitoring(intervalMs);
  }

  dispose(): void {
    try {
      this.releaseAll();

      if (this.voicePool) {
        this.voicePool.dispose();
        this.voicePool = null as unknown as SampleVoicePool;
      }

      if (this.outBus) {
        this.outBus.dispose();
        this.outBus = null as unknown as InstrumentMasterBus;
      }

      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();

      this.#macroLoopStart = null as unknown as MacroParam;
      this.#macroLoopEnd = null as unknown as MacroParam;

      // Reset state variables
      this.#bufferDuration = 0;
      this.#isReady = false;
      this.#isLoaded = false;
      this.#zeroCrossings = [];
      this.#useZeroCrossings = false;
      this.#loopEnabled = false;

      this.audioContext = null as unknown as AudioContext;
      this.messages = null as unknown as MessageBus<Message>;

      // Detach keyboard handler
      if (this.keyboardHandler) {
        globalKeyboardInput.removeHandler(this.keyboardHandler);
        this.keyboardHandler = null;
      }

      // todo: disableMIDI
    } catch (error) {
      console.error(`Error disposing Sampler ${this.nodeId}:`, error);
    }
  }

  get out() {
    return this.outBus.output;
  }

  get outputBus() {
    return this.outBus;
  }

  get context() {
    return this.audioContext;
  }

  get now() {
    return this.audioContext.currentTime;
  }

  get sampleDuration(): number {
    return this.#bufferDuration;
  }

  get volume(): number {
    return this.outBus.volume;
  }

  set volume(value: number) {
    this.outBus.volume = value;
  }

  get loopEnabled(): boolean {
    return this.#loopEnabled;
  }

  get holdEnabled(): boolean {
    return this.#holdEnabled;
  }

  get loopStart(): number {
    return this.#macroLoopStart.getValue();
  }

  get loopEnd(): number {
    return this.#macroLoopEnd.getValue();
  }

  get initialized() {
    return this.#isReady;
  }

  get isLoaded() {
    return this.#isLoaded;
  }

  // for UI integration
  getParameterDescriptors(): Record<string, LibParamDescriptor> {
    return {
      attack: DEFAULT_PARAM_DESCRIPTORS.ATTACK,
      release: DEFAULT_PARAM_DESCRIPTORS.RELEASE,
      startPoint: DEFAULT_PARAM_DESCRIPTORS.START_POINT,
      endPoint: DEFAULT_PARAM_DESCRIPTORS.END_POINT,
      playbackRate: DEFAULT_PARAM_DESCRIPTORS.PLAYBACK_RATE,
      loopStart: this.#macroLoopStart.descriptor,
      loopEnd: this.#macroLoopEnd.descriptor,
      loopRampDuration: DEFAULT_PARAM_DESCRIPTORS.LOOP_RAMP_DURATION,
      hpfCutoff: DEFAULT_PARAM_DESCRIPTORS.HIGHPASS_CUTOFF,
      lpfCutoff: DEFAULT_PARAM_DESCRIPTORS.LOWPASS_CUTOFF,
    };
  }

  getParameterValue(name: string): number | undefined {
    switch (name) {
      case 'loopStart':
        return this.loopStart;
      case 'loopEnd':
        return this.loopEnd;
      case 'loopRampDuration':
        return this.getLoopRampDuration();
      case 'attack':
        return this.getAttackTime();
      case 'release':
        return this.getReleaseTime();
      case 'startPoint':
        return this.getStartPoint();
      case 'endPoint':
        return this.getEndPoint();
      case 'playbackRate':
        return this.getPlaybackRate();
      // case 'hpfCutoff':
      //   return this.getHpfCutoff();
      // case 'lpfCutoff':
      //   return this.getLpfCutoff();
      default:
        console.warn(`Unknown parameter: ${name}`);
        return undefined;
    }
  }

  setParameterValue(name: string, value: number): this {
    switch (name) {
      case 'attack':
        this.setAttackTime(value);
        break;
      case 'release':
        this.setReleaseTime(value);
        break;
      case 'startPoint':
        this.setSampleStartPoint(value);
        break;
      case 'endPoint':
        this.setSampleEndPoint(value);
        break;
      case 'playbackRate':
        this.setPlaybackRate(value);
        break;
      case 'loopStart':
        this.setLoopStart(value);
        break;
      case 'loopEnd':
        this.setLoopEnd(value);
        break;
      case 'loopRampDuration':
        this.setLoopRampDuration(value);
        break;
      default:
        console.warn(`Unknown parameter: ${name}`);
    }
    return this;
  }

  setScale(rootNote: string, scalePattern: number[], options?: any): this {
    // Existing code to set scale on macros
    this.#macroLoopStart.setScale(rootNote, scalePattern, options);
    this.#macroLoopEnd.setScale(rootNote, scalePattern, options);

    // Get the periods from the snapper
    const periods = this.#macroLoopEnd.snapper.periods;

    // ! Pass to voices IF they individually handle period quantization (snapping)
    this.voicePool.applyToAllVoices((voice) =>
      voice.setAllowedPeriods(periods)
    );

    return this;
  }
}
