type DattorroReverbPresetKey = keyof typeof DattorroReverb.PRESETS;

export class DattorroReverb {
  #node: AudioWorkletNode;
  #currentPreset: DattorroReverbPresetKey;

  // todo: make better presets and ensure consistent volume
  // currently omitting 'wet' param
  static readonly PRESETS = {
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
    default: {
      // Note: WIP
      preDelay: 100,
      bandwidth: 0.9, // -bandwith === pre LPF !
      inputDiffusion1: 0.4,
      inputDiffusion2: 0.55,
      decay: 0.2,
      decayDiffusion1: 0.65,
      decayDiffusion2: 0.6,
      damping: 0.2,
      excursionRate: 0.5,
      excursionDepth: 0.5,
    },

    // get default() {
    //   return this.room;
    // },
  } as const;

  constructor(context: AudioContext) {
    this.#node = new AudioWorkletNode(context, 'dattorro-reverb-processor', {
      outputChannelCount: [2], // NOTE: Currently ONLY supports stereo output
    });

    this.#setParam('dry', 0); // Only using wet! (consider removing dry from processor)

    this.setPreset('default');
    this.#currentPreset = 'default';

    this.setAmountMacro(0);
  }

  connect(destination: AudioNode): void {
    this.#node.connect(destination);
  }

  disconnect(): void {
    this.#node.disconnect();
  }

  // === SETTERS ===

  #setParam(name: string, value: number): void {
    if (!isFinite(value)) {
      console.warn(`Skipping non-finite value for ${name}:`, value);
      return;
    }
    this.#node.parameters
      .get(name)
      ?.setValueAtTime(value, this.#node.context.currentTime);
  }

  mapToRange = (
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ) => ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  clamp = (value: number, min: number, max: number) =>
    Math.max(min, Math.min(max, value));

  setAmountMacro(amount: number) {
    if (amount < 0 || amount > 1) {
      console.warn('Reverb amount must be 0-1 range');
      return;
    }

    const presetValues = DattorroReverb.PRESETS[this.#currentPreset];

    // Map amount (0-1) to scale from preset value up to max
    const decay = this.mapToRange(
      amount, // Map amount directly
      0, // Input range: 0 to 1
      1,
      presetValues.decay, // Output min: preset value
      0.9 // Output max
    );

    const excRate = this.mapToRange(
      amount,
      0,
      1,
      presetValues.excursionRate,
      2
    );

    const excDepth = this.mapToRange(
      amount,
      0,
      1,
      presetValues.excursionDepth,
      2
    );

    const damping = this.mapToRange(amount, 0, 1, presetValues.damping, 0.8);
    const preLPF = this.mapToRange(amount, 0, 1, presetValues.bandwidth, 0.3);
    const diffusion = this.mapToRange(amount, 0, 1, 0, 0.7);

    // console.table({ decay, excRate, excDepth, damping, preLPF, diffusion });

    this.diffusionMacro = diffusion;
    this.getParam('decay')?.setTargetAtTime(decay, this.now, 0.1);
    this.#setParam('excursionRate', excRate);
    this.#setParam('excursionDepth', excDepth);
    this.#setParam('damping', damping);
    this.#setParam('bandwidth', preLPF);
  }

  setPreset(
    preset: 'room' | 'church' | 'freeze' | 'ether' | 'default' = 'default',
    rampTime = 0.5
  ): void {
    this.#currentPreset = preset;
    const values = DattorroReverb.PRESETS[preset];
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

  /** 
    DIFFUSION PARAMETER (0.0 - 1.0, default: 0.7)
    Controls reverb density and scatter. Higher = more complex tail.

    0.0 - No diffusion, echoes/delays only        | Special effects, rhythmic delays
    0.3 - Light scatter, clear open sound         | Vocals, acoustic instruments  
    0.5 - Moderate density, balanced              | General purpose, drums
    0.7 - Rich diffusion, full reverb tail        | Orchestral, ambient music
    0.9 - Very dense, thick complex tail          | Dense mixes, sound design
    1.0 - Maximum density, can sound harsh        | Experimental/aggressive sounds
  **/
  set diffusionMacro(value: number) {
    const fi = Math.max(0.1, value * 0.75);
    const si = Math.max(0.1, value * 0.625);
    const ft = Math.min(0.7, Math.max(0.1, value * 0.6));
    const st = Math.max(0.2, value * 0.4);

    this.#setParam('inputDiffusion1', fi);
    this.#setParam('inputDiffusion2', si);
    this.#setParam('decayDiffusion1', ft);
    this.#setParam('decayDiffusion2', st);
  }

  // === GETTERS ===

  getParam(name: string) {
    return this.#node.parameters.get(name);
  }

  getCurrentSettings(): Record<string, number> {
    const result: Record<string, number> = {};

    Array.from(this.#node.parameters.keys()).forEach((paramName) => {
      result[paramName] = this.#node.parameters.get(paramName)?.value ?? 0;
    });

    return result;
  }

  get input(): AudioNode {
    return this.#node;
  }

  get output(): AudioNode {
    return this.#node;
  }

  get now() {
    return this.#node.context.currentTime;
  }

  get currentPreset() {
    return this.#currentPreset;
  }

  get diffusionMacro(): number {
    // Return approximate macro value based on current inputDiffusion1
    const fi = this.getParam('inputDiffusion1')?.value ?? 0.75;
    return (fi - 0.1) / (0.75 - 0.1); // Reverse the mapping
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
