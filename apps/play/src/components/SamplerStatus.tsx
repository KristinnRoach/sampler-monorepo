import type { Component } from 'solid-js';

type SamplerStatusProps = {
  audioInitialized: boolean;
  sampleLoaded: boolean;
  error: string | null;
};

const SamplerStatus: Component<SamplerStatusProps> = (props) => (
  <div
    class='sampler-status'
    role='status'
    aria-live='polite'
    aria-atomic='true'
    style='font-family: monospace; font-size: 12px;'
  >
    {props.error
      ? `Error: ${props.error}`
      : !props.audioInitialized
        ? 'Click to start'
        : props.sampleLoaded
          ? 'Sample loaded'
          : 'Initialized'}
  </div>
);

export default SamplerStatus;
