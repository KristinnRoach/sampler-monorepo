import { onMount } from 'solid-js';
import { OscilloscopeElement } from '../../elements/OscilloscopeElement';

declare module 'solid-js' {
  namespace JSX {
    interface IntrinsicElements {
      'oscilloscope-element': any;
    }
  }
}

export interface OscilloscopeProps {
  ctx: AudioContext;
  input: AudioNode;
}

export function Oscilloscope(props: OscilloscopeProps) {
  let ref: OscilloscopeElement | undefined;

  onMount(() => {
    if (ref) {
      ref.connectAudio(props.ctx, props.input);
    }
  });

  return <oscilloscope-element ref={ref} />;
}

export default Oscilloscope;
