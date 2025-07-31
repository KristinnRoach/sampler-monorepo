// LibInstrument.ts - Cleaned Version (Step 1)

import { createNodeId, NodeID } from '@/nodes/node-store';
import { assert, tryCatch } from '@/utils';
import { LibNode, Connectable, Messenger, Destination } from '@/nodes/LibNode';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';

import { MidiController } from '@/io';

import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';

import { SampleVoicePool } from '@/nodes/instruments/Sample/SampleVoicePool';
import { KarplusVoicePool } from '@/nodes/instruments/Synth/KarplusStrong/KarplusVoicePool';
import { localStore } from '@/storage/local';

export type InstrumentType = 'sample-player'; // | 'synth';

export abstract class LibInstrument implements LibNode, Connectable, Messenger {
  public readonly nodeId: NodeID;
  readonly nodeType: InstrumentType;

  public messages: MessageBus<Message>;
  protected midiController: MidiController | null = null;

  protected voicePool: SampleVoicePool | KarplusVoicePool | null = null;

  public audioContext: AudioContext;
  public outBus: InstrumentMasterBus;
  protected destination: Destination | null = null;

  constructor(
    nodeType: InstrumentType,
    context: AudioContext,
    polyphony: number = 16,
    audioBuffer?: AudioBuffer,
    midiController?: MidiController
  ) {
    this.nodeType = nodeType;
    this.nodeId = createNodeId(this.nodeType);
    this.audioContext = context;
    this.messages = createMessageBus<Message>(this.nodeId);
    this.outBus = new InstrumentMasterBus();

    // Initialize MIDI controller if provided
    this.midiController = midiController || null;
  }

  /**
   * Helper method to store parameter values in local storage
   */
  protected storeParamValue(paramId: string, value: any): void {
    const key = this.getLocalStorageKey(paramId);
    localStore.saveValue(key, value);
  }

  /**
   * Helper method to retrieve parameter values from local storage
   */
  protected getStoredParamValue<T extends number | string>(
    paramId: string,
    defaultValue: T
  ): T {
    const key = this.getLocalStorageKey(paramId);
    return localStore.getValue(key, defaultValue);
  }

  /**
   * Creates a consistent local storage key for parameters
   */
  protected getLocalStorageKey(paramName: string): string {
    return `${paramName}-${this.nodeId}`;
  }

  // Messaging - Shared implementation
  public onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  public sendUpstreamMessage(type: string, data: any): this {
    this.messages.sendMessage(type, data);
    return this;
  }

  // Abstract methods that must be implemented by subclasses
  abstract play(midiNote: MidiValue, velocity?: number): MidiValue | null;
  abstract release(note: MidiValue): this;
  abstract releaseAll(fadeOut_sec?: number): this;

  // Common functionality for all instruments
  panic = (fadeOut_sec?: number) => this.releaseAll(fadeOut_sec);

  // MIDI input
  async enableMIDI(
    midiController?: MidiController,
    channel: number = 0
  ): Promise<this> {
    if (!midiController) {
      midiController = new MidiController();
      await midiController.initialize();
    }

    if (midiController.isInitialized) {
      this.midiController = midiController;
      midiController.connectInstrument(this, channel);
    }
    return this;
  }

  disableMIDI(midiController?: MidiController, channel: number = 0): this {
    const controller = midiController || this.midiController;
    controller?.disconnectInstrument(channel);
    if (controller === this.midiController) {
      this.midiController = null;
    }
    return this;
  }

  // Connection methods
  public connect(destination: Destination): Destination {
    assert(destination instanceof AudioNode, 'remember to fix this');

    this.outBus.connect(destination);
    this.destination = destination;
    return destination;
  }

  public disconnect() {
    this.outBus.disconnect();
    this.destination = null;
    return this;
  }

  abstract initialized: boolean;

  // Common getters
  get now(): number {
    return this.audioContext.currentTime;
  }

  /**
   * Clean up all resources.
   */
  dispose() {
    this.panic(0);
    this.disconnect();
    this.disableMIDI();

    // REMOVED: Setting properties to null - let subclasses handle their own cleanup
    // audioContext and messages should be cleaned up by subclasses if needed
  }
}
