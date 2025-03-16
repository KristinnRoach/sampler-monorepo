import 'solid-js';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'custom-element': any; // If needed, replace "custom-element" with the name of your custom element
    }
  }
}
