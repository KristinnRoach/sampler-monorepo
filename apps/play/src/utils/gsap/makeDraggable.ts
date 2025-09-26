import { qs } from '../dom-utils';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

export const makeDraggable = (
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
  const { axis } = gsapOptions || null;

  let el: Element | null = null;
  if (element) el = element;
  else if (className) el = qs(className);

  if (!(el instanceof Element)) {
    console.warn(`makeDraggable: Invalid Element.`);
    return;
  }

  return Draggable.create(el, {
    type: axis || 'x,y',
    trigger:
      handleElement ??
      el.querySelector(handleClassName || '.drag-handle') ??
      el,
  });
};

// import { qs } from './utils';
// import { makeDraggable } from './utils/makeDraggable';

// const samplerContainerEl = qs('#sampler-container');

// createAndAppendHandle(samplerContainerEl);
// if (samplerContainerEl) {
//   makeDraggable(
//     {
//       element: samplerContainerEl,
//       handleClassName: '.drag-handle',
//     },
//     {
//       type: 'x,y',
//     }
//   );
// }

// function createAndAppendHandle(element: Element | null) {
//   if (!element || element.querySelector('.drag-handle')) return;
//   const handle = document.createElement('div');
//   handle.className = 'drag-handle';
//   handle.setAttribute('aria-label', 'Drag to move this control group');
//   element.appendChild(handle);
// }
