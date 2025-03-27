// Everything that is common to all nodes, BaseAudioNode and BaseWorkletNode implement BaseNode

/* CONSTANTS */
const DEFAULT_RAMP_TIME = 0.01; // 10ms

export const CONSTANTS = {
  DEFAULT_RAMP_TIME,
};

/* METHODS */
export const METHODS = {
  setParam(
    node: AudioNode,
    name: string,
    value: number,
    rampTime: number = DEFAULT_RAMP_TIME,
    offsetSeconds = 0
  ): boolean {
    const param = (node as any)[name] as AudioParam;
    if (!param || !(param instanceof AudioParam)) {
      console.warn(`Parameter "${name}" not found`);
      return false;
    }

    param.setTargetAtTime(
      value,
      node.context.currentTime + offsetSeconds,
      rampTime
    );

    return true;
  },
};

export const DEFAULTS = {
  CONSTANTS,
  METHODS,
} as const;
