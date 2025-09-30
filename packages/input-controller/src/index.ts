import { WebMidi } from 'webmidi';

export type NoteEvent = {
  type: 'noteon' | 'noteoff';
  note: number;
  velocity: number;
  channel: number;
  raw: any;
};

type NoteHandler = (event: NoteEvent) => void;

export class InputController {
  #initialized = false;
  #noteOnHandlers = new Set<NoteHandler>();
  #noteOffHandlers = new Set<NoteHandler>();

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
}

export const inputController = new InputController();
