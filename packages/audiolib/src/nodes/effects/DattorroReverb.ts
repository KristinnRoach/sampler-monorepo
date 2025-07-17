export class DattorroReverb {
  #node: AudioWorkletNode;

  constructor(context: AudioContext) {
    this.#node = new AudioWorkletNode(context, 'dattorro-reverb-processor', {
      outputChannelCount: [2], // NOTE: Currently ONLY supports stereo output
    });
  }

  connect(destination: AudioNode): void {
    this.#node.connect(destination);
  }

  disconnect(): void {
    this.#node.disconnect();
  }

  // === PARAM SETTERS ===

  #setParam(name: string, value: number): void {
    this.#node.parameters
      .get(name)
      ?.setValueAtTime(value, this.#node.context.currentTime);
  }

  set preDelay(value: number) {
    this.#setParam('preDelay', value);
  }
  set bandwidth(value: number) {
    this.#setParam('bandwidth', value);
  }
  set inputDiffusion1(value: number) {
    this.#setParam('inputDiffusion1', value);
  }
  set inputDiffusion2(value: number) {
    this.#setParam('inputDiffusion2', value);
  }
  set decay(value: number) {
    this.#setParam('decay', value);
  }
  set decayDiffusion1(value: number) {
    this.#setParam('decayDiffusion1', value);
  }
  set decayDiffusion2(value: number) {
    this.#setParam('decayDiffusion2', value);
  }
  set damping(value: number) {
    this.#setParam('damping', value);
  }
  set excursionRate(value: number) {
    this.#setParam('excursionRate', value);
  }
  set excursionDepth(value: number) {
    this.#setParam('excursionDepth', value);
  }
  set wet(value: number) {
    this.#setParam('wet', value);
  }
  set dry(value: number) {
    this.#setParam('dry', value);
  }

  // === GETTERS ===

  get input(): AudioNode {
    return this.#node;
  }

  get output(): AudioNode {
    return this.#node;
  }
}

// Direct AudioWorkletNode alternative:
// export class DattorroReverb extends AudioWorkletNode {
//   constructor(context: AudioContext) {
//     super(context, 'dattorro-reverb-processor');
//   }

//   // Parameter setters
//   set preDelay(value: number) {
//     this.parameters
//       .get('preDelay')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set bandwidth(value: number) {
//     this.parameters
//       .get('bandwidth')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set inputDiffusion1(value: number) {
//     this.parameters
//       .get('inputDiffusion1')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set inputDiffusion2(value: number) {
//     this.parameters
//       .get('inputDiffusion2')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set decay(value: number) {
//     this.parameters
//       .get('decay')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set decayDiffusion1(value: number) {
//     this.parameters
//       .get('decayDiffusion1')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set decayDiffusion2(value: number) {
//     this.parameters
//       .get('decayDiffusion2')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set damping(value: number) {
//     this.parameters
//       .get('damping')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set excursionRate(value: number) {
//     this.parameters
//       .get('excursionRate')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set excursionDepth(value: number) {
//     this.parameters
//       .get('excursionDepth')
//       ?.setValueAtTime(value, this.context.currentTime);
//   }
//   set wet(value: number) {
//     this.parameters.get('wet')?.setValueAtTime(value, this.context.currentTime);
//   }
//   set dry(value: number) {
//     this.parameters.get('dry')?.setValueAtTime(value, this.context.currentTime);
//   }
// }
