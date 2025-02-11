// // src/instruments/sampler.ts - Public Sampler class

// export interface SampledInstrument extends Instrument {
//   loadSample(url: string): Promise<void>;
//   noteOn(note: number, velocity?: number): void;
//   noteOff(note: number): void;
// }

// export class Sampled implements Instrument {
//   private engine: SamplerEngine;
//   private loader: SampleLoader;
//   private mainGain: GainNode;
//   private output: AudioNode | AudioNode[];

//   constructor(
//     private context: AudioContext,
//     options?: SamplerOptions,
//     output?: AudioNode
//   ) {
//     this.mainGain = context.createGain();
//     this.loader = new SampleLoader(context);
//     this.engine = new SamplerEngine(context, this.mainGain, options);
//     this.output = output || context.destination;
//     this.mainGain.connect(this.context.destination);
//   }

//   async loadSample(url: string): Promise<void> {
//     const buffer = await this.loader.loadSample(url);
//     this.engine.setSample(buffer);
//   }

//   noteOn(note: number, velocity = 100): void {
//     this.engine.noteOn(note, velocity);
//   }

//   noteOff(note: number): void {
//     this.engine.noteOff(note);
//   }
// }
