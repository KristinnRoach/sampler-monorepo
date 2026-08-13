import { Oscilloscope } from '@repo/audiolib';

export class OscilloscopeElement extends HTMLElement {
  private oscilloscope?: Oscilloscope;
  private canvas?: HTMLCanvasElement;

  constructor() {
    super();
  }

  connectedCallback() {
    // Create canvas when element is connected to DOM
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = 300;
      this.canvas.height = 150;
      this.appendChild(this.canvas);
    }
  }

  connectAudio(ctx: AudioContext, input: AudioNode) {
    if (!this.canvas) {
      this.connectedCallback();
    }
    if (this.canvas) {
      this.oscilloscope = new Oscilloscope(ctx, input, this.canvas);
    }
  }
}

customElements.define('oscilloscope-element', OscilloscopeElement);
