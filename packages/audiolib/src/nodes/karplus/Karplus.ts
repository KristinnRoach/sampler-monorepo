import { getAudioContext } from '@/context';

export class Karplus {
  audioContext: AudioContext;
  noiseGenerator: AudioWorkletNode;
  feedbackDelay: AudioWorkletNode;
  noiseGain: GainNode;
  outputGain: GainNode;

  delayParam: AudioParam;
  holdMs: number = 10;

  fbParamMap: Map<string, AudioParam>;
  noiseParamMap: Map<string, AudioParam>;

  constructor() {
    const ctx = getAudioContext();
    this.audioContext = ctx;
    this.noiseGenerator = new AudioWorkletNode(ctx, 'noise-generator');
    this.noiseGain = new GainNode(ctx, { gain: 0 });
    this.outputGain = new GainNode(ctx);
    this.feedbackDelay = new AudioWorkletNode(ctx, 'feedback-delay-processor', {
      parameterData: {
        delayTime: 5, // Initial delay time
        gain: 0.9, // Initial feedback gain (controls decay)
      },
    });

    this.fbParamMap = this.feedbackDelay.parameters as Map<string, AudioParam>;
    this.noiseParamMap = this.noiseGenerator.parameters as Map<
      string,
      AudioParam
    >;

    this.delayParam = this.fbParamMap.get('delayTime')!;

    // Connect
    this.noiseGenerator.connect(this.noiseGain);
    this.noiseGain.connect(this.outputGain);
    this.noiseGain.connect(this.feedbackDelay);
    this.feedbackDelay.connect(this.outputGain);
    this.outputGain.connect(ctx.destination);
  }

  play() {
    this.ctx.resume();

    // Calculate actual delay time (accounting for buffer size)
    const bufferCompensation = (1000 * 128) / this.ctx.sampleRate;
    const newDelay = Number(this.delayParam) + bufferCompensation;
    this.delay = { ms: newDelay };

    // Schedule noise burst to excite the string
    this.noiseGain.gain.setValueAtTime(0.5, this.now);
    this.noiseGain.gain.linearRampToValueAtTime(
      0,
      this.now + this.holdMs / 1000
    );
  }

  set delay({ ms, rampTime = 0.2 }: { ms: number; rampTime?: number }) {
    this.delayParam.linearRampToValueAtTime(ms, this.now + rampTime);
  }

  get ctx() {
    return this.audioContext;
  }

  get now() {
    return this.audioContext.currentTime;
  }
}
