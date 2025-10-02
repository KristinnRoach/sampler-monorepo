import { WebMidi } from 'webmidi';

export type NoteEvent = {
  type: 'noteon' | 'noteoff';
  note: number;
  velocity: number;
  channel: number;
  raw: any;
};

export type ControlChangeEvent = {
  type: 'controlchange';
  controller: number;
  value: number;
  channel: number;
  raw: any;
};

type NoteHandler = (event: NoteEvent) => void;
type ControlChangeHandler = (event: ControlChangeEvent) => void;

export type NoteTarget = {
  play: (note: number, velocity?: number) => void;
  release: (note: number) => void;
};

export class InputController {
  #initialized = false;
  #noteOnHandlers = new Set<NoteHandler>();
  #noteOffHandlers = new Set<NoteHandler>();
  #controlChangeHandlers = new Set<ControlChangeHandler>();

  async init(): Promise<boolean> {
    if (this.#initialized) return true;

    try {
      await WebMidi.enable();
    } catch (error) {
      console.warn('InputController: WebMIDI enable failed', error);
      return false;
    }

    if (!WebMidi.enabled) {
      console.warn('InputController: WebMIDI not enabled');
      return false;
    }

    this.#initialized = true;
    this.#attachToInputs();
    return true;
  }

  onNoteOn(handler: NoteHandler): () => void {
    this.#noteOnHandlers.add(handler);
    return () => this.#noteOnHandlers.delete(handler);
  }

  onNoteOff(handler: NoteHandler): () => void {
    this.#noteOffHandlers.add(handler);
    return () => this.#noteOffHandlers.delete(handler);
  }

  onControlChange(handler: ControlChangeHandler): () => void {
    this.#controlChangeHandlers.add(handler);
    return () => this.#controlChangeHandlers.delete(handler);
  }

  registerNoteTarget(
    target: NoteTarget,
    channel: number | 'all' = 'all'
  ): () => void {
    const noteOnUnsub = this.onNoteOn((event) => {
      if (!this.#matchesChannel(channel, event.channel)) return;
      target.play(event.note, event.velocity ?? 0);
    });

    const noteOffUnsub = this.onNoteOff((event) => {
      if (!this.#matchesChannel(channel, event.channel)) return;
      target.release(event.note);
    });

    return () => {
      noteOnUnsub();
      noteOffUnsub();
    };
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  #attachToInputs(): void {
    WebMidi.inputs.forEach((input) => {
      if (!input) return;

      input.addListener('noteon', (event: any) => {
        this.#emit(this.#noteOnHandlers, event, 'noteon');
      });

      input.addListener('noteoff', (event: any) => {
        this.#emit(this.#noteOffHandlers, event, 'noteoff');
      });

      input.addListener('controlchange', (event: any) => {
        this.#emitControlChange(event);
      });
    });
  }

  #emit(handlers: Set<NoteHandler>, event: any, type: 'noteon' | 'noteoff') {
    if (!handlers.size) return;

    const payload: NoteEvent = {
      type,
      note: event.note?.number ?? 0,
      velocity:
        event.note?.rawAttack ??
        (typeof event.velocity === 'number'
          ? event.velocity
          : (event.note?.attack ?? 0)),
      channel: event.channel ?? 1,
      raw: event,
    };

    handlers.forEach((handler) => handler(payload));
  }

  #emitControlChange(event: any) {
    if (!this.#controlChangeHandlers.size) return;

    const payload: ControlChangeEvent = {
      type: 'controlchange',
      controller:
        event.controller?.number ??
        event.controller?.value ??
        (typeof event.controller === 'number' ? event.controller : 0),
      value:
        typeof event.value === 'number'
          ? event.value
          : typeof event.rawValue === 'number'
            ? event.rawValue
            : 0,
      channel: event.channel ?? 1,
      raw: event,
    };

    this.#controlChangeHandlers.forEach((handler) => handler(payload));
  }

  #matchesChannel(target: number | 'all', incoming: number | undefined) {
    if (target === 'all') return true;
    if (typeof incoming !== 'number') return false;
    return target === incoming;
  }
}

export const inputController = new InputController();
