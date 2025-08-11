// AMModulation.ts - Composite element for AM modulation controls
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { AMModKnob } from './SamplerKnobFactory';
import { WaveformSelect } from './SamplerSelectFactory';

const { div } = van.tags;

const AM_COMPOSITE_STYLE = `
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

export const AMModulation = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const showWaveLabel = attributes.attr('show-wave-label', 'false'); // Default to no label

  // Create label position state once to avoid repeated state allocations
  const labelPositionState = van.state('below');

  // Create the inner controls with the same target node id
  const knobElement = AMModKnob({
    attr: (name: string, defaultValue: any) => {
      if (name === 'target-node-id') return targetNodeId;
      return attributes.attr(name, defaultValue);
    },
    mount: attributes.mount,
    $this: attributes.$this,
  } as ElementProps);

  const selectElement = WaveformSelect({
    attr: (name: string, defaultValue: any) => {
      if (name === 'target-node-id') return targetNodeId;
      if (name === 'label-position') return labelPositionState; // Label below for composite
      if (name === 'show-label') return showWaveLabel; // Pass through the label preference
      return attributes.attr(name, defaultValue);
    },
    mount: attributes.mount,
    $this: attributes.$this,
  } as ElementProps);

  return div(
    {
      style: AM_COMPOSITE_STYLE,
      class: 'am-modulation-composite',
    },
    // Knob at the top
    knobElement,
    // Compact select below
    selectElement
  );
};
