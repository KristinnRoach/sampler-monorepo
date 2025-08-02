// addNode.ts
import van from '@repo/vanjs-core';
import { qs } from './dom-utils';

const { div, select, option, button } = van.tags;

let elementCounter = 0;
export const addNode = (
  elementName: 'sampler-monolith' | 'sampler-element' | 'volume-knob', // karplus-synth
  parent?: Element,
  nodeId?: string
) => {
  const currElCount = elementCounter++;

  const nodeElFn = van.tags[elementName];

  const handleEl = div({
    id: `handle-for-${elementName}-${currElCount}`,
    class: 'drag-handle',
  });
  const parentEl = parent ?? qs('.nodes-playground') ?? document.body;

  const wrapperEl = div(
    { class: `${elementName}-wrapper node-draggable` },
    handleEl,
    nodeElFn({
      expanded: false,
    })
  );

  van.add(parentEl, wrapperEl);

  return { nodeEl: nodeElFn(), handleEl, wrapperEl };
};

export const createAddNodeButton = () => {
  return div(
    { class: 'add-el-div' },
    button({ class: 'add-el-btn' }, '+'),
    select(
      { id: 'node-select', class: 'node-select' },
      option({ value: 'sampler-monolith' }, 'Sampler Monolith'),
      option({ value: 'sampler-element' }, 'Sampler'),
      option({ value: 'volume-knob' }, 'Volume Knob')
    )
  );
};
