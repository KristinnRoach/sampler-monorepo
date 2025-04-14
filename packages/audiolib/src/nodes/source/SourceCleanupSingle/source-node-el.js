// source-node-element.js
import { NodeID } from '@/types/global';
import { createNodeId } from '@/store/IdStore';
import { SourceWorkletNode } from './SourceWorkletNode';
import { getAudioContext, ensureAudioCtx } from '@/context';

class SourceNodeElement extends HTMLElement {
  static get observedAttributes() {
    return ['loop', 'playback-rate', 'loop-start', 'loop-end'];
  }

  #src = null;
  #audioContext = null;
  #buffer = null;

  constructor({ props }) {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    this.#audioContext = await ensureAudioCtx();

    if (!this.#audioContext) console.error('failed to ensure audio context');

    try {
      this.#src = await SourceWorkletNode.create(this.#audioContext, {
        buffer: this.#buffer,
        channelCount: 2,
      });

      // Apply initial attribute values
      this.#updateFromAttributes();

      // Connect to audio context destination by default
      this.#src.connect(this.#audioContext.destination);

      this.dispatchEvent(
        new CustomEvent('ready', {
          detail: { sourceNode: this.#src },
        })
      );
    } catch (error) {
      console.error('Failed to initialize SourceNode:', error);
      this.dispatchEvent(new CustomEvent('error', { detail: error }));
    }
  }

  disconnectedCallback() {
    this.dispose();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.#src) return;

    this.#updateFromAttributes();
  }

  #updateFromAttributes() {
    if (!this.#src) return;

    // Handle loop attribute
    const loopAttr = this.getAttribute('loop');
    if (loopAttr !== null) {
      this.#src.setLoopEnabled(loopAttr === 'true' || loopAttr === '');
    }

    // Handle numeric attributes
    const playbackRate = parseFloat(this.getAttribute('playback-rate'));
    if (!isNaN(playbackRate)) {
      this.#src.playbackRate.value = playbackRate;
    }

    const loopStart = parseFloat(this.getAttribute('loop-start'));
    if (!isNaN(loopStart)) {
      this.#src.loopStart.value = loopStart;
    }

    const loopEnd = parseFloat(this.getAttribute('loop-end'));
    if (!isNaN(loopEnd)) {
      this.#src.loopEnd.value = loopEnd;
    }
  }

  get sourceNode() {
    return this.#src;
  }

  get audioContext() {
    return this.#audioContext;
  }

  set buffer(audioBuffer) {
    this.#buffer = audioBuffer;
    if (this.#src) {
      this.#src.buffer = audioBuffer;
    }
  }

  playNote(midiNote, velocity = 1.0, startTime) {
    if (this.#src) {
      this.#src.playNote(midiNote, velocity, startTime);
      return true;
    }
    return false;
  }

  start(when = 0, offset = 0, duration) {
    if (this.#src) {
      this.#src.start(when, offset, duration);
      return true;
    }
    return false;
  }

  stop(when = 0) {
    if (this.#src) {
      this.#src.stop(when);
      return true;
    }
    return false;
  }

  setOnEnded(callback) {
    if (this.#src) {
      this.#src.setOnEnded(callback);
      return true;
    }
    return false;
  }

  connect(destination) {
    if (this.#src) {
      this.#src.connect(destination);
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.#src) {
      this.#src.disconnect();
      return true;
    }
    return false;
  }

  dispose() {
    if (this.#src) {
      this.#src.dispose();
      this.#src = null;
    }

    if (this.#audioContext) {
      this.#audioContext
        .close()
        .catch((err) => console.error('Error closing AudioContext:', err));
      this.#audioContext = null;
    }
  }
}

// Register the custom element
customElements.define('source-node', SourceNodeElement);

export { SourceNodeElement };
