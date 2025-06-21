import van from '@repo/vanjs-core';
import { qs } from './dom-utils';

const { div, select, option, button } = van.tags;

let nodeId = 0;
export const addNode = (
  nodeType: 'sampler' | 'karplus-synth',
  parent?: Element,
  options: any = {}
) => {
  const currId = nodeId++;

  const nodeElFn = van.tags[`${nodeType}-element`];

  const handleEl = div({
    id: `handle-for-${nodeType}-${currId}`,
    class: 'drag-handle',
  });
  const parentEl = parent ?? qs('.nodes-playground') ?? document.body;

  const wrapperEl = div(
    { class: `${nodeType}-wrapper node-draggable` },
    handleEl,
    nodeElFn({
      polyphony: '32',
      id: `${nodeType}-${currId}`,
      class: `${nodeType}-${currId}`,
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
      option({ value: 'sampler' }, 'Sampler'),
      option({ value: 'karplus-synth' }, 'Karplus Synth')
    )
  );
};
