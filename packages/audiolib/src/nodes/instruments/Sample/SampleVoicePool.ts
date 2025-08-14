import { SampleVoice } from './SampleVoice';
import { registerNode, unregisterNode, NodeID } from '@/nodes/node-store';
import { midiToPlaybackRate, pop } from '@/utils';
import { VoiceState } from '../VoiceState';
import {
  Message,
  MessageHandler,
  MessageBus,
  createMessageBus,
} from '@/events';
import { LibNode } from '@/nodes/LibNode';

export class SampleVoicePool implements LibNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'pool';
  #messages: MessageBus<Message>;
  #context: AudioContext;
  #initialized = false;
  #initPromise: Promise<void> | null = null;
  #polyphony: number;

  #allVoices: SampleVoice[] = [];
  #loaded = new Set<NodeID>();
  #available = new Set<SampleVoice>();
  #playing = new Set<SampleVoice>();
  #releasing = new Set<SampleVoice>();

  #playingMidiVoiceMap = new Map<MidiValue, SampleVoice>();

  #gainReductionScalar = 1; // Reduces gain based on number of playing voices

  constructor(context: AudioContext, polyphony: number) {
    this.nodeId = registerNode(this.nodeType, this);
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#context = context;
    this.#polyphony = polyphony;
  }

  async init() {
    if (this.#initialized) return;
    if (this.#initPromise) return this.#initPromise;

    this.#initPromise = (async () => {
      try {
        this.#allVoices = Array.from(
          { length: this.#polyphony },
          () => new SampleVoice(this.#context)
        );
        await Promise.all(
          this.#allVoices.map(async (voice) => {
            await voice.init();
            this.#available.add(voice);
            this.#setupMessageHandling(voice);
          })
        );
        this.#initialized = true;
      } catch (error) {
        this.#allVoices.forEach((voice) => voice.dispose());
        this.#allVoices = [];
        this.#available.clear();
        this.#initPromise = null;

        const errorMessage =
          error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to initialize SamplePlayer: ${errorMessage}`);
      }
    })();

    return this.#initPromise;
  }

  connect(destination: AudioNode) {
    this.#allVoices.forEach((voice) => {
      voice.connect(destination);
    });
  }

  disconnect() {
    this.#allVoices.forEach((voice) => {
      voice.disconnect();
    });
  }

  /* === MESSAGES === */

  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.#messages.onMessage(type, handler);
  }

  sendUpstreamMessage(type: string, data: any) {
    this.#messages.sendMessage(type, data);
    return this;
  }

  #initializedVoices = new Set<SampleVoice>();
  #setupMessageHandling(voice: SampleVoice) {
    voice.onMessage('voice:started', (msg: Message) => {
      // Ensure mutual exlusion (idempotent delete)
      this.#available.delete(msg.voice);
      this.#releasing.delete(msg.voice);

      this.#playing.add(msg.voice);
      this.#onVoiceStateChange();

      this.#playingMidiVoiceMap.set(msg.midiNote, msg.voice);
    });

    voice.onMessage('voice:releasing', (msg: Message) => {
      // Ensure mutual exlusion
      this.#available.delete(msg.voice);
      this.#playing.delete(msg.voice);

      this.#releasing.add(msg.voice);

      // Remove from midiToVoice map, is this voice owns this midinote
      if (this.#playingMidiVoiceMap.get(msg.midiNote) === msg.voice) {
        this.#playingMidiVoiceMap.delete(msg.midiNote);
      }
    });

    voice.onMessage('voice:stopped', (msg: Message) => {
      // Ensure mutual exlusion
      this.#playing.delete(msg.voice);
      this.#releasing.delete(msg.voice);

      this.#onVoiceStateChange();

      this.#available.add(msg.voice);
    });

    voice.onMessage('voice:initialized', (msg: Message) => {
      this.#initializedVoices.add(msg.voice);

      if (this.#initializedVoices.size === this.#allVoices.length) {
        // All voices initialized message
        this.sendUpstreamMessage('voice-pool:initialized', {
          voiceCount: this.#allVoices.length,
        });
      }
    });

    this.#messages.forwardFrom(
      voice,
      [
        'voice:initialized',
        'voice:started',
        'voice:stopped',
        'voice:releasing',
        'voice:loaded',
        'voice:transposed',

        'amp-env:trigger',
        'amp-env:trigger:loop',
        'amp-env:release',
        'pitch-env:trigger',
        'pitch-env:trigger:loop',
        'pitch-env:release',
        'filter-env:trigger',
        'filter-env:trigger:loop',
        'filter-env:release',
      ],
      (msg) => {
        if (msg.type === 'voice:loaded') {
          this.#loaded.add(msg.senderId);

          // Only send 'sample:loaded' when all voices are loaded
          if (this.#loaded.size === this.#allVoices.length) {
            return { ...msg, type: 'sample:loaded' };
          }
          return null; // Don't forward individual voice:loaded messages
        }
        return msg;
      }
    );
  }

  setBuffer(buffer: AudioBuffer, zeroCrossings?: number[]) {
    // Reset loaded voices tracking for new buffer
    this.#loaded.clear();
    this.#allVoices.forEach((voice) => voice.loadBuffer(buffer, zeroCrossings));
    return this;
  }

  allocate(
    available = this.#available,
    releasing = this.#releasing,
    playing = this.#playing
  ): SampleVoice {
    let voice;

    if (available.size) {
      voice = pop(available);
    } else if (releasing.size) {
      voice = pop(releasing);
      voice?.stop();
    } else if (playing.size) {
      voice = pop(playing);
      voice?.stop();
    }

    if (!voice) throw new Error(`Could not allocate voice`);

    return voice;
  }

  prevMidiNote = 60;

  noteOn(
    midiNote: MidiValue,
    velocity: MidiValue = 100,
    secondsFromNow = 0,
    glideTime = 0,
    currentLoopEnd?: number
  ): MidiValue | null {
    const voice = this.allocate();

    const success = voice.trigger({
      midiNote: midiNote,
      velocity,
      secondsFromNow,
      currentLoopEnd,
      glide: { prevMidiNote: this.prevMidiNote, glideTime },
    });

    if (success) {
      this.#playingMidiVoiceMap.set(midiNote, voice);
      this.prevMidiNote = midiNote;
      return midiNote;
    } else {
      return null;
    }
  }

  noteOff(
    midiNote: MidiValue,
    secondsFromNow: number = 0,
    releaseTime?: number
  ) {
    const voice = this.#playingMidiVoiceMap.get(midiNote);
    if (!voice) return;

    if (voice?.state === VoiceState.PLAYING) {
      voice.release({ secondsFromNow, releaseTime });
    }

    return this;
  }

  allNotesOff(releaseTime = 0) {
    this.#playingMidiVoiceMap.forEach((voice) => {
      voice.release({ releaseTime });
    });

    this.#playingMidiVoiceMap.clear();
    return this;
  }

  applyToAllVoices(fn: (voice: SampleVoice) => void) {
    this.#allVoices.forEach((voice) => fn(voice));
  }

  applyToActiveVoices(fn: (voice: SampleVoice) => void) {
    this.#playingMidiVoiceMap.forEach((voice) => fn(voice));
  }

  applyToInactiveVoices(fn: (voice: SampleVoice) => void) {
    this.#available.forEach((voice) => fn(voice));
  }

  applyToActiveNote(midiNote: MidiValue, fn: (voice: SampleVoice) => void) {
    const voice = this.#playingMidiVoiceMap.get(midiNote);
    if (voice) {
      fn(voice);
    } else {
      console.warn(`No active voice found for midiNote: ${midiNote}`);
    }
  }

  #GAIN_REDUCTION_SENSITIVITY = 0.4;

  #updateVoiceGains() {
    const activeCount = this.#playing.size + this.#releasing.size;

    if (activeCount === 0) {
      this.#gainReductionScalar = 1;
      return;
    }

    this.#gainReductionScalar =
      1 / (1 + Math.log10(activeCount) * this.#GAIN_REDUCTION_SENSITIVITY);

    // Apply to all playing voices (skip 'releasing' since they are fading out)
    [...this.#playing].forEach((voice) => {
      voice.setMasterGain(this.#gainReductionScalar);
    });
  }

  // Call this whenever voice state changes
  #onVoiceStateChange() {
    this.#updateVoiceGains();
  }

  debug() {
    console.debug(
      `
      releasing: ${this.#releasing.size}
      playing: ${this.#playing.size}
      available: ${this.#available.size}
      Sum: ${this.#releasing.size + this.#playing.size + this.#available.size}
      Sum should be: ${this.allVoicesCount}
      `,
      { midiToVoiceMap: this.#playingMidiVoiceMap }
    );
  }

  dispose() {
    this.applyToAllVoices((voice) => voice.dispose());
    this.#allVoices = [];
    this.#playingMidiVoiceMap.clear();
    this.#available.clear();
    this.#releasing.clear();
    this.#playing.clear();
    this.#loaded.clear();
    this.#initialized = false;
    this.#initPromise = null;
    unregisterNode(this.nodeId);
  }

  get initialized() {
    return this.#initialized;
  }

  get availableVoices() {
    return this.#available;
  }

  get playingVoicesCount() {
    return this.#playing.size;
  }

  get releasingVoicesCount() {
    return this.#releasing.size;
  }

  get availableVoicesCount() {
    return this.#available.size;
  }

  get allVoices() {
    return this.#allVoices;
  }

  get allVoicesCount() {
    return this.#allVoices.length;
  }

  get assignedVoicesMidiMap() {
    return this.#playingMidiVoiceMap;
  }

  set transposeSemitones(semitones: number) {
    this.#allVoices.forEach((voice) => (voice.transposeSemitones = semitones));
  }
}
