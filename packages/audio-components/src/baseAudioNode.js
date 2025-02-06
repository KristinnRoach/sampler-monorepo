// baseAudioNode.js
import { AudioContextProvider } from './audioContext.js';

export class BaseAudioNode extends HTMLElement {
  constructor() {
    super();
    this.inputs = new Map();
    this.outputs = new Map();
    this.initialized = false;
    this.contextProvider = AudioContextProvider.getInstance();
    this._initializationPromise = null;
  }

  async getContext() {
    return this.contextProvider.getContext();
  }

  async waitForInit() {
    if (this.initialized) {
      return Promise.resolve();
    }
    if (!this._initializationPromise) {
      this._initializationPromise = new Promise((resolve) => {
        const checkInit = () => {
          if (this.initialized) {
            resolve();
          } else {
            requestAnimationFrame(checkInit);
          }
        };
        checkInit();
      });
    }
    return this._initializationPromise;
  }

  async connect(destination, outputName = 'default', inputName = 'default') {
    console.log('Waiting for nodes to initialize...');
    await Promise.all([this.waitForInit(), destination.waitForInit()]);

    console.log('Nodes initialized, checking connection points...');
    console.log('Available outputs:', [...this.outputs.keys()]);
    console.log('Available inputs:', [...destination.inputs.keys()]);

    const output = this.outputs.get(outputName);
    const input = destination.inputs.get(inputName);

    if (!output || !input) {
      throw new Error(
        `Invalid connection points: ${outputName} -> ${inputName}. ` +
          `Available outputs: [${[...this.outputs.keys()]}], ` +
          `Available inputs: [${[...destination.inputs.keys()]}]`
      );
    }

    console.log('Connecting nodes...');
    output.connect(input);
    return destination;
  }

  disconnect(destination, outputName = 'default', inputName = 'default') {
    const output = this.outputs.get(outputName);
    const input = destination.inputs.get(inputName);

    if (output && input) {
      output.disconnect(input);
    }
  }
}
