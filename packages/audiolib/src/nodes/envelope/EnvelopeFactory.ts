export type EnvelopeType = 'AR' | 'ADSR';

export type EnvelopeParams = {
  attackMs: number;
  decayMs?: number;
  sustainLevel?: number;
  releaseMs: number;
};

export interface AmpEnvelopeNode {
  params: EnvelopeParams;
  triggerAttack: (when?: number) => void;
  triggerRelease: (when?: number) => void;
  setParam: (param: keyof (keyof EnvelopeParams), value: number) => void;

  getGainNode: () => GainNode;
  connect: (destination: AudioNode) => AudioNode;
  disconnect: () => void;
}

export function createAmpEnvNode(
  ctx: AudioContext,
  envType: EnvelopeType = 'AR',
  params: EnvelopeParams = {
    attackMs: 0.01,
    releaseMs: 0.2,
  }
): AmpEnvelopeNode {
  const node = ctx.createGain();
  node.gain.value = 0;

  const getGainNode = () => node;

  const connect = (destination: AudioNode) => {
    node.connect(destination);
    return destination;
  };

  const disconnect = () => {
    node.disconnect();
  };

  const triggerAttack = (when: number = ctx.currentTime) => {
    node.gain.cancelScheduledValues(when);
    node.gain.setValueAtTime(0, when);
    node.gain.linearRampToValueAtTime(1, when + params.attackMs / 1000);

    if (envType === 'AR') return;

    if (envType === 'ADSR' && params.decayMs && params.sustainLevel) {
      const startDecay = when + params.attackMs / 1000;
      const endDecay = startDecay + params.decayMs / 1000;

      // After attack, decay to sustain level if ADSR
      node.gain.linearRampToValueAtTime(params.sustainLevel, endDecay);
    }
  };

  const triggerRelease = (when: number = ctx.currentTime) => {
    node.gain.cancelScheduledValues(when);
    node.gain.setValueAtTime(node.gain.value, when);
    node.gain.linearRampToValueAtTime(0, when + params.releaseMs / 1000);
  };

  const setParam = (param: keyof (keyof EnvelopeParams), value: number) => {
    if (param in params) {
      (params as any)[param] = value;
    }
  };

  return {
    params: params,
    triggerAttack,
    triggerRelease,
    setParam,
    getGainNode,
    connect,
    disconnect,
  };
}
