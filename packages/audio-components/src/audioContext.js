// audioContext.js
export class AudioContextProvider extends HTMLElement {
  static instance = null;

  constructor() {
    super();
    if (AudioContextProvider.instance) {
      return AudioContextProvider.instance;
    }

    this.audioContext = null;
    this.isContextStarted = false;
    this.pendingResolvers = new Set();
    AudioContextProvider.instance = this;

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            pointer-events: none;
          }
          
          .status {
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 8px 16px;
            background: #333;
            color: white;
            border-radius: 4px;
            font-family: system-ui;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s;
          }
          
          .status.visible {
            opacity: 1;
          }
        </style>
        <div class="status" id="status">Waiting for user interaction...</div>
      `;

    this.statusElement = this.shadowRoot.getElementById('status');
  }

  static getInstance() {
    if (!AudioContextProvider.instance) {
      AudioContextProvider.instance = new AudioContextProvider();
    }
    return AudioContextProvider.instance;
  }

  connectedCallback() {
    document.addEventListener(
      'mousemove',
      this.handleFirstInteraction.bind(this),
      { once: true }
    );
    document.addEventListener('click', this.handleFirstInteraction.bind(this), {
      once: true,
    });

    this.statusElement.classList.add('visible');
    setTimeout(() => {
      if (!this.isContextStarted) {
        this.statusElement.classList.remove('visible');
      }
    }, 3000);
  }

  disconnectedCallback() {
    document.removeEventListener(
      'mousemove',
      this.handleFirstInteraction.bind(this)
    );
    document.removeEventListener(
      'click',
      this.handleFirstInteraction.bind(this)
    );
  }

  async handleFirstInteraction(event) {
    if (this.isContextStarted) return;

    try {
      this.audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      await this.audioContext.resume();

      this.isContextStarted = true;
      this.statusElement.textContent = 'Audio Context Started';
      this.statusElement.classList.add('visible');

      for (const resolver of this.pendingResolvers) {
        resolver(this.audioContext);
      }
      this.pendingResolvers.clear();

      setTimeout(() => {
        this.statusElement.classList.remove('visible');
      }, 2000);
    } catch (error) {
      console.error('Failed to start AudioContext:', error);
      this.statusElement.textContent = 'Failed to start Audio Context';
      this.statusElement.style.background = '#cc0000';
      this.statusElement.classList.add('visible');
    }
  }

  async getContext() {
    if (this.isContextStarted && this.audioContext) {
      return this.audioContext;
    }

    return new Promise((resolve) => {
      this.pendingResolvers.add(resolve);
    });
  }

  async suspend() {
    if (this.audioContext) {
      await this.audioContext.suspend();
      this.statusElement.textContent = 'Audio Context Suspended';
      this.statusElement.classList.add('visible');
      setTimeout(() => {
        this.statusElement.classList.remove('visible');
      }, 2000);
    }
  }

  async resume() {
    if (this.audioContext) {
      await this.audioContext.resume();
      this.statusElement.textContent = 'Audio Context Resumed';
      this.statusElement.classList.add('visible');
      setTimeout(() => {
        this.statusElement.classList.remove('visible');
      }, 2000);
    }
  }
}

// Register the custom element
customElements.define('audio-context', AudioContextProvider);

// Usage example:
/*
// In HTML:
<audio-context></audio-context>

// In JavaScript:
async function initAudio() {
  const contextProvider = AudioContextProvider.getInstance();
  const context = await contextProvider.getContext();
  // context is now ready to use
}

// To suspend/resume:
const contextProvider = AudioContextProvider.getInstance();
await contextProvider.suspend();
await contextProvider.resume();
*/
