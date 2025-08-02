// addNode.ts
import van from '@repo/vanjs-core';
import { qs } from './dom-utils';

const { div, select, option, button } = van.tags;

let elementCounter = 0;
export const addNode = (
  nodeType: 'sampler' | 'karplus-synth' | 'volume-knob',
  parent?: Element,
  nodeId?: string
) => {
  const currElCount = elementCounter++;

  const nodeElFn = van.tags[`${nodeType}-element`];

  const handleEl = div({
    id: `handle-for-${nodeType}-${currElCount}`,
    class: 'drag-handle',
  });
  const parentEl = parent ?? qs('.nodes-playground') ?? document.body;

  const wrapperEl = div(
    { class: `${nodeType}-wrapper node-draggable` },
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
      option({ value: 'sampler' }, 'Sampler')
    )
  );
};
