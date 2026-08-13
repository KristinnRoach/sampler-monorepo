/**
 * WebAudio Keyboard TypeScript Declarations
 * Type definitions for the webaudio-keyboard custom element
 */

interface WebAudioKeyboardElement extends HTMLElement {
  /** Width of the keyboard in pixels (default: 480) */
  width: number;
  /** Height of the keyboard in pixels (default: 128) */
  height: number;
  /** Minimum MIDI note number (default: 0) */
  min: number;
  /** Number of keys to display (default: 25) */
  keys: number;
  /** Color scheme as semicolon-separated string (default: '#222;#eee;#ccc;#333;#000;#e88;#c44;#c33;#800') */
  colors: string;
  /** Whether the keyboard is enabled for interaction (default: 1) */
  enable: number;
  /** Whether to enable built-in keyboard event handling (default: false) */
  keyboard?: boolean;

  /** Sets a note on/off programmatically with optional scheduling */
  setNote(
    state: number,
    note: number,
    audioContext?: AudioContext,
    when?: number
  ): void;
}

interface WebAudioKeyboardEvent extends Event {
  /** [state, note] where state is 0 (off) or 1 (on), note is MIDI number */
  note: [number, number];
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'webaudio-keyboard': Partial<WebAudioKeyboardElement> & {
        width?: number;
        height?: number;
        min?: number;
        keys?: number;
        colors?: string;
        enable?: number;
        keyboard?: boolean;
        onkeyboard?: (event: WebAudioKeyboardEvent) => void;
        onpointer?: (event: WebAudioKeyboardEvent) => void;
      };
    }
  }

  interface HTMLElementTagNameMap {
    'webaudio-keyboard': WebAudioKeyboardElement;
  }

  interface HTMLElementEventMap {
    /** Fired when keys are pressed/released via keyboard input */
    keyboard: WebAudioKeyboardEvent;
    /** Fired when keys are pressed/released via pointer/touch input */
    pointer: WebAudioKeyboardEvent;
  }
}

export { WebAudioKeyboardElement, WebAudioKeyboardEvent };
