import van from '@repo/vanjs-core';
import { qs } from './utils';
import { makeDraggable } from './utils/makeDraggable';
import { addNode, createAddNodeButton } from './utils/addNode';
import { defineSamplerMonolith } from '@repo/audio-components';

let samplerEl: any;

const init = async () => {
  defineSamplerMonolith();

  const nodesContainer = qs('.nodes-playground')!;

  van.add(nodesContainer, createAddNodeButton());

  const addElBtn = qs('.add-el-btn');
  const selectEl = qs('.node-select') as HTMLSelectElement;

  addElBtn?.addEventListener('click', () => {
    const nodeName = selectEl.value as 'sampler-monolith'; // | 'karplus-synth';
    const instrumentEls = addNode(nodeName, nodesContainer);

    samplerEl = qs('sampler-monolith');

    const draggable = makeDraggable({
      element: instrumentEls.wrapperEl,
      handleElement: instrumentEls.handleEl,
    });
  });

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
});
