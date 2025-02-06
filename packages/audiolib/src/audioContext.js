// audioContext.js
export class AudioContextManager {
  static instance = null;

  constructor() {
    if (AudioContextManager.instance) {
      return AudioContextManager.instance;
    }
    this.context = null;
    this.isInitialized = false;
    AudioContextManager.instance = this;
  }

  static getInstance() {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  async initialize() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      await this.context.resume();
      this.isInitialized = true;
    }
    return this.context;
  }

  getContext() {
    return this.context;
  }
}
