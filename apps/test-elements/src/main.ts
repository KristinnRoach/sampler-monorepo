import van from '@repo/vanjs-core';
import { qs } from './utils';

import { initAudiolib } from './utils/initAudiolib';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

import { addNode, createAddNodeButton } from './utils/addInstrument';

gsap.registerPlugin(Draggable);

const makeDraggable = (
  elementOptions: {
    element?: Element | null;
    handleElement?: Element | null;
    className?: string;
    handleClassName?: string;
  } = {},
  gsapOptions: any = {}
) => {
  const {
    element,
    handleElement,
    className = '',
    handleClassName = '',
  } = elementOptions;
  const { axis } = gsapOptions ?? null;

  let el: Element | null = null;
  if (element) el = element;
  else if (className) el = qs(className);

  if (!(el instanceof Element)) {
    console.warn(`makeDraggable: Invalid Element.`);
    return;
  }

  return Draggable.create(el, {
    type: axis || 'x,y',
    trigger: handleElement
      ? handleElement
      : el.querySelector(handleClassName ?? '.drag-handle' ?? undefined),
  });
};

const init = async () => {
  const audiolib = await initAudiolib();
  console.info(audiolib); // ?

  const nodesContainer = qs('.nodes-playground')!;

  van.add(nodesContainer, createAddNodeButton());

  const addElBtn = qs('.add-el-btn');
  const selectEl = qs('.node-select') as HTMLSelectElement;

  addElBtn?.addEventListener('click', () => {
    const nodeName = selectEl.value as 'sampler' | 'karplus-synth';
    const instrumentEls = addNode(nodeName, nodesContainer);

    const draggable = makeDraggable({
      element: instrumentEls.wrapperEl,
      handleElement: instrumentEls.handleEl,
    });
    console.table(draggable);
  });

  console.log('Web Audio Elements app initialized');
};

document.addEventListener('DOMContentLoaded', () => init());

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') e.preventDefault();
});

// // ___________TEST_____________________
// const { h1 } = van.tags;
// const testEnv = div(
//   {
//     style:
//       'padding: 20px; background: #1a1a1a; color: white; min-height: 100vh;',
//   },
//   h1('Envelope Test'),
//   van.tags['env-element']({})
// );
// van.add(nodesContainer, testEnv);
// // ___________TEST_____________________
