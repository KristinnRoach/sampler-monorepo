declare global {
  namespace JSX {
    interface IntrinsicElements {
      'webaudio-knob': any;
      'webaudio-slider': any;
      'webaudio-switch': any;
      'webaudio-param': any;
      'webaudio-keyboard': any;
    }
  }
}

// For direct element access
declare global {
  interface HTMLElementTagNameMap {
    'webaudio-knob': HTMLElement;
    'webaudio-slider': HTMLElement;
    'webaudio-switch': HTMLElement;
  }
}

export {};
