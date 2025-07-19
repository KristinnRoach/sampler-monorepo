export class DattorroReverb {
  #node: AudioWorkletNode;

  // todo: make better presets and ensure consistent volume
  static readonly #presets = {
    room: {
      preDelay: 1525,
      bandwidth: 0.5683,
      inputDiffusion1: 0.4666,
      inputDiffusion2: 0.5853,
      decay: 0.3226,
      decayDiffusion1: 0.6954,
      decayDiffusion2: 0.6022,
      damping: 0.6446,
      excursionRate: 0,
      excursionDepth: 0,
    },
    church: {
      preDelay: 0,
      bandwidth: 0.928,
      inputDiffusion1: 0.7331,
      inputDiffusion2: 0.4534,
      decay: 0.7,
      decayDiffusion1: 0.7839,
      decayDiffusion2: 0.1992,
      damping: 0.5975,
      excursionRate: 0,
      excursionDepth: 0,
    },
    freeze: {
      preDelay: 0,
      bandwidth: 0.999,
      inputDiffusion1: 0.75,
      inputDiffusion2: 0.625,
      decay: 1,
      decayDiffusion1: 0.5,
      decayDiffusion2: 0.711,
      damping: 0.005,
      excursionRate: 0.3,
      excursionDepth: 1.4,
    },
    ether: {
      preDelay: 0,
      bandwidth: 0.999,
      inputDiffusion1: 0.23,
      inputDiffusion2: 0.667,
      decay: 0.45,
      decayDiffusion1: 0.7,
      decayDiffusion2: 0.5,
      damping: 0.3,
      excursionRate: 0.85,
      excursionDepth: 1.2,
    },
  } as const;

  constructor(context: AudioContext) {
    this.#node = new AudioWorkletNode(context, 'dattorro-reverb-processor', {
      outputChannelCount: [2], // NOTE: Currently ONLY supports stereo output
    });

    this.#setParam('dry', 0); // Only using wet! (todo: consider refactoring processor to enforce this & optimize)
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
  // set dry(value: number) {
  //   this.#setParam('dry', value);
  // }

  // === PRESET METHODS ===

  setPreset(
    preset: 'room' | 'church' | 'freeze' | 'ether' = 'room',
    rampTime = 0.2
  ): void {
    const values = DattorroReverb.#presets[preset];
    const currentTime = this.#node.context.currentTime;

    Object.entries(values).forEach(([paramName, value]) => {
      const param = this.#node.parameters.get(paramName);
      if (param) {
        param.linearRampToValueAtTime(value, currentTime + rampTime);
      } else {
        console.warn(`Parameter '${paramName}' not found in reverb node`);
      }
    });
  }

  getPreset(): Record<string, number> {
    const result: Record<string, number> = {};

    Array.from(this.#node.parameters.keys()).forEach((paramName) => {
      result[paramName] = this.#node.parameters.get(paramName)?.value ?? 0;
    });

    return result;
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
