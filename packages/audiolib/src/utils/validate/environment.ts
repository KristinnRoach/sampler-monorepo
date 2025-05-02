interface AudioEnvironment {
  readonly cancelAndHoldSupported: boolean;
  readonly workletSupported: boolean;
  readonly keyboardAPISupported: boolean;
  readonly modifierStateSupported: boolean;
}

interface Keyboard {
  getLayoutMap(): Promise<Record<string, string>>;
  [key: string]: any;
}

declare global {
  interface Navigator {
    keyboard?: Keyboard;
  }
}

class Environment {
  #capabilities: AudioEnvironment;

  constructor() {
    try {
      // Audio capabilities
      const AudioContextConstructor =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextConstructor();
      const param = ctx.createGain().gain;

      // Keyboard capabilities
      const hasKeyboardAPI =
        typeof navigator !== 'undefined' && 'keyboard' in navigator;
      const hasModifierState =
        typeof KeyboardEvent !== 'undefined' &&
        typeof KeyboardEvent.prototype.getModifierState === 'function';

      this.#capabilities = {
        cancelAndHoldSupported: typeof param.cancelAndHoldAtTime === 'function',
        workletSupported: typeof ctx.audioWorklet === 'object',
        keyboardAPISupported: hasKeyboardAPI,
        modifierStateSupported: hasModifierState,
      };

      ctx.close().catch(console.error);
    } catch (error) {
      // Fallback for test environment
      this.#capabilities = {
        cancelAndHoldSupported: false,
        workletSupported: false,
        keyboardAPISupported: false,
        modifierStateSupported: false,
      };
    }
  }

  get capabilities(): AudioEnvironment {
    return this.#capabilities;
  }
}

// Singleton instance
export const environment = new Environment();

// Convenience getters
export const isCancelAndHoldSupported = () =>
  environment.capabilities.cancelAndHoldSupported;
export const isWorkletSupported = () =>
  environment.capabilities.workletSupported;
export const isKeyboardAPISupported = () =>
  environment.capabilities.keyboardAPISupported;
export const isModifierStateSupported = () =>
  environment.capabilities.modifierStateSupported;
