interface AudioEnvironment {
  readonly cancelAndHoldSupported: boolean;
  readonly workletSupported: boolean;
  readonly keyboardAPISupported: boolean;
  readonly modifierStateSupported: boolean;
  // Add more capabilities as needed
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
    // Audio capabilities
    const ctx = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const param = new GainNode(ctx).gain;

    // Keyboard capabilities
    const hasKeyboardAPI =
      typeof navigator !== 'undefined' && 'keyboard' in navigator;
    const hasModifierState =
      typeof KeyboardEvent.prototype.getModifierState === 'function';

    this.#capabilities = {
      // Audio
      cancelAndHoldSupported: typeof param.cancelAndHoldAtTime === 'function',
      workletSupported: typeof ctx.audioWorklet === 'object',
      // Keyboard
      keyboardAPISupported: hasKeyboardAPI,
      modifierStateSupported: hasModifierState,
    };

    ctx.close(); // Clean up test context
  }

  get capabilities(): AudioEnvironment {
    return this.#capabilities;
  }
}

// Singleton instance
export const environment = new Environment();

// Convenience getters for audio capabilities
export const isCancelAndHoldSupported = () =>
  environment.capabilities.cancelAndHoldSupported;
export const isWorkletSupported = () =>
  environment.capabilities.workletSupported;

// Convenience getters for keyboard capabilities
export const isKeyboardAPISupported = () =>
  environment.capabilities.keyboardAPISupported;
export const isModifierStateSupported = () =>
  environment.capabilities.modifierStateSupported;
