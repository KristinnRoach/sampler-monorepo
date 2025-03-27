// import { loadFileAsString } from './base/worklet-utils';
import { tryCatch } from '@/utils/tryCatch';
import { getAudioContext } from '@/context/globalAudioContext';
// import { registry } from './base/WorkletRegistry';
// import { getStandardizedAWPNames } from './base/worklet-utils';

// import processorCode from './noise-processor.js?raw';
// or

export class RandomNoiseWorklet {
  ctx: AudioContext | null = null;
  gain: GainNode | null = null;
  noise: AudioWorkletNode | null = null;
  constructor() {}

  async start() {
    console.log('Noise start');

    this.ctx = await getAudioContext();

    if (!this.ctx) {
      throw new Error('No AudioContext available');
    }

    this.gain = new GainNode(this.ctx, {
      gain: 0.1,
    });

    this.ctx.resume();

    const code = await import('./noise-processor.js?raw').then(
      (m) => m.default
    );

    const blob = new Blob([code], {
      type: 'application/javascript',
    });

    const promise = this.ctx.audioWorklet.addModule(URL.createObjectURL(blob));

    await tryCatch(promise, `Error registering processor noise-processor`);

    this.noise = new AudioWorkletNode(this.ctx, 'random-noise-processor', {
      outputChannelCount: [1],
    });

    this.noise.connect(this.gain);
    this.gain.connect(this.ctx.destination);
  }

  stop() {
    if (this.noise) {
      this.noise.disconnect();
      this.noise.port.close();
      this.noise = null;
    }
    this.gain?.disconnect();
    this.gain = null;
  }
}
