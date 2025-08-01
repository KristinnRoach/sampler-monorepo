import van from '@repo/vanjs-core';
import { qs } from './utils';

import { makeDraggable } from './utils/makeDraggable';
import { addNode, createAddNodeButton } from './utils/addNode';
import { defineSampler } from '@repo/audio-components';

let samplerEl: any;

const init = async () => {
  defineSampler();

  const nodesContainer = qs('.nodes-playground')!;

  van.add(nodesContainer, createAddNodeButton());

  // Example: Add a sampler and immediately create a volume knob for it
  const { nodeEl: samplerNode, wrapperEl: samplerWrapper } = addNode('sampler');

  // Wait a tiny bit for the sampler to initialize and get its nodeId
  setTimeout(() => {
    const samplerElement = samplerWrapper.querySelector('sampler-element');
    const nodeId = samplerElement?.getAttribute('data-node-id');

    if (nodeId && nodeId !== 'initializing') {
      // Add a volume knob that targets this sampler
      const { wrapperEl: volumeWrapper } = addNode(
        'volume-knob',
        undefined,
        nodeId
      );

      // Position the volume knob next to the sampler
      volumeWrapper.style.position = 'absolute';
      volumeWrapper.style.left = '600px';
      volumeWrapper.style.top = '100px';
    }
  }, 100);
};

//   const addElBtn = qs('.add-el-btn');
//   const selectEl = qs('.node-select') as HTMLSelectElement;

//   addElBtn?.addEventListener('click', () => {
//     const nodeName = selectEl.value as 'sampler' | 'karplus-synth';
//     const instrumentEls = addNode(nodeName, nodesContainer);

//     samplerEl = qs('sampler-element');

//     const draggable = makeDraggable({
//       element: instrumentEls.wrapperEl,
//       handleElement: instrumentEls.handleEl,
//     });
//   });

//   console.log('Web Audio Elements app initialized');
// };

document.addEventListener('DOMContentLoaded', () => init());

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
});
