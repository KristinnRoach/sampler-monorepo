import { BaseAudioElement } from './base/BaseAudioElement';
import { audiolib } from '@repo/audiolib';

/**
 * Web component for loading audio samples
 */
export class SampleLoaderElement extends BaseAudioElement {
  private audioBuffer: AudioBuffer | null = null;

  constructor() {
    super('sample-loader');

    this.innerHTML = `
      <div class="sample-loader">
        <button class="load-button" id="load" disabled>Load Sample</button>
        <div class="status" id="status">Not initialized</div>
      </div>
    `;
  }

  connectedCallback(): void {
    this.querySelector('#load')?.addEventListener(
      'click',
      this.loadSample.bind(this)
    );
    this.initialize();
  }

  async initialize(): Promise<void> {
    try {
      this.updateStatus('Ready to load sample');
      this.enableControls();

      this.dispatchEvent(
        new CustomEvent('loader-initialized', {
          bubbles: true,
          detail: { loader: this },
        })
      );
    } catch (error) {
      console.error('Failed to initialize sample loader:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  connect(destination: BaseAudioElement) {
    this.setAttribute('target-element-id', destination.elementId);
    return this;
  }

  async loadSample(): Promise<void> {
    try {
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = 'audio/*';

      fileInput.onchange = async (event) => {
        const target = event.target as HTMLInputElement;
        const files = target.files;

        if (files && files.length > 0) {
          const file = files[0];
          this.updateStatus(`Loading sample: ${file.name}...`);

          try {
            const arrayBuffer = await file.arrayBuffer();

            // for now just create a new AudioContext
            const ctx = await audiolib.ensureAudioCtx();
            this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);

            this.updateStatus(`Sample loaded: ${file.name}`);

            this.dispatchEvent(
              new CustomEvent('sample-loaded', {
                bubbles: true,
                detail: {
                  targetId: this.getAttribute('target-element-id'),
                  audioBuffer: this.audioBuffer,
                  fileName: file.name,
                  duration: this.audioBuffer.duration,
                },
              })
            );
          } catch (error) {
            console.error('Failed to load sample:', error);
            this.updateStatus(
              `Error loading sample: ${error instanceof Error ? error.message : String(error)}`
            );
          }
        }
      };

      fileInput.click();
    } catch (error) {
      console.error('Failed to load sample:', error);
      this.updateStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private updateStatus(message: string): void {
    const statusElement = this.querySelector('#status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }

  private enableControls(): void {
    const loadButton = this.querySelector('#load');
    if (loadButton) loadButton.removeAttribute('disabled');
  }

  getAudioBuffer(): AudioBuffer | null {
    return this.audioBuffer;
  }

  disconnectedCallback(): void {
    this.audioBuffer = null;
  }
}
