import { createNodeId, NodeID } from '@/nodes/node-store';
import { assert, tryCatch } from '@/utils';
import { LibNode, Connectable, Messenger, Destination } from '@/nodes/LibNode';
import { InstrumentMasterBus } from '@/nodes/master/InstrumentMasterBus';

import {
  MidiController,
  globalKeyboardInput,
  InputHandler,
  PressedModifiers,
} from '@/io';

import {
  Message,
  MessageBus,
  MessageHandler,
  createMessageBus,
} from '@/events';

import type { MidiValue, ActiveNoteId } from '@/nodes/instruments/types';
import { SampleVoicePool } from '@/nodes/instruments/Sample/SampleVoicePool';
import { KarplusVoicePool } from '@/nodes/instruments/Synth/KarplusStrong/KarplusVoicePool';
import { localStore } from '@/storage/local';

export type InstrumentType = 'sample-player' | 'synth';

export abstract class LibInstrument implements LibNode, Connectable, Messenger {
  readonly nodeId: NodeID;
  readonly nodeType: InstrumentType;

  protected messages: MessageBus<Message>;
  protected keyboardHandler: InputHandler | null = null;
  protected midiController: MidiController | null = null;

  protected voicePool: SampleVoicePool | KarplusVoicePool | null = null;

  protected audioContext: AudioContext;
  protected outBus: InstrumentMasterBus;
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

  // Messaging
  onMessage(type: string, handler: MessageHandler<Message>): () => void {
    return this.messages.onMessage(type, handler);
  }

  protected sendUpstreamMessage(type: string, data: any): this {
    this.messages.sendMessage(type, data);
    return this;
  }

  // Abstract methods that must be implemented by subclasses
  abstract play(
    midiNote: MidiValue,
    velocity?: number,
    modifiers?: Partial<PressedModifiers>
  ): ActiveNoteId;

  abstract release(
    note: MidiValue | ActiveNoteId,
    modifiers?: Partial<PressedModifiers>
  ): this;

  abstract releaseAll(fadeOut_sec?: number): this;

  // Common functionality for all instruments

  panic = (fadeOut_sec?: number) => this.releaseAll(fadeOut_sec);

  // Keyboard input
  enableKeyboard(): this {
    if (!this.keyboardHandler) {
      this.keyboardHandler = {
        onNoteOn: this.play.bind(this),
        onNoteOff: this.release.bind(this),
        onBlur: this.handleBlur.bind(this),
        onModifierChange: this.handleModifierKeys.bind(this),
      };
      globalKeyboardInput.addHandler(this.keyboardHandler);
    }
    return this;
  }

  disableKeyboard(): this {
    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    }
    return this;
  }

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

  // Event handlers (can be overridden)
  protected handleBlur(): this {
    this.panic();
    return this;
  }

  protected handleModifierKeys(modifiers: PressedModifiers): this {
    // todo: Default implementation - subclasses can override for custom behavior
    return this;
  }

  // Connection methods
  public connect(destination: Destination): Destination {
    assert(destination instanceof AudioNode, 'remember to fix this'); // TODO
    this.outBus.connect(destination);
    this.destination = destination;
    return destination;
  }

  public disconnect(output?: 'main' | 'alt' | 'all'): this {
    this.outBus.disconnect(output);
    if (output === 'main' || output === 'all') {
      this.destination = null;
    }
    return this;
  }

  abstract isReady: boolean;

  // Common getters
  get now(): number {
    return this.audioContext.currentTime;
  }

  get volume(): number {
    return this.outBus.volume;
  }

  set volume(value: number) {
    this.outBus.volume = value;
  }

  /**
   * Clean up all resources.
   */
  dispose() {
    this.panic(0);
    this.disconnect();
    this.disableKeyboard();
    this.disableMIDI();

    this.audioContext = null as unknown as AudioContext;
    this.messages = null as unknown as MessageBus<Message>;

    // Detach keyboard handler
    if (this.keyboardHandler) {
      globalKeyboardInput.removeHandler(this.keyboardHandler);
      this.keyboardHandler = null;
    }
  }
}

// // Standard parameter management methods
// /**
//  * Sets a parameter value with optional debouncing
//  */
// setParamValue(paramId: string, value: any, debounceMs: number = 0): this {
//   this.params.setValue(paramId, value, debounceMs);
//   this.sendUpstreamMessage('param:change', { paramId, value });
//   return this;
// }

// /**
//  * Gets a parameter value by ID
//  */
// getParamValue(paramId: string): any {
//   const param = this.params.get(paramId);
//   return param ? param.getValue() : undefined;
// }

// /**
//  * Gets all parameters
//  */
// getAllParams(): LibParam[] {
//   return this.params.getAll();
// }

// /**
//  * Gets parameters by group
//  */
// getParamsByGroup(group: string): LibParam[] {
//   return this.params.getByGroup(group);
// }
