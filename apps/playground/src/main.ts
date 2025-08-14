import { defineSampler } from '@repo/audio-components';
import { addKeyboardToggleHandler } from './utils/toggleKeyboardVisual';
import { qs } from './utils';
import { makeDraggable } from './utils/makeDraggable';

defineSampler(); // Define all sampler components

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');

  addKeyboardToggleHandler();

  const samplerContainerEl = qs('#sampler-container');
  createAndAppendHandle(samplerContainerEl);

  if (samplerContainerEl) {
    makeDraggable(
      {
        element: samplerContainerEl,
        handleClassName: '.drag-handle',
      },
      {
        type: 'x,y',
      }
    );
  }
});

function createAndAppendHandle(element: Element | null) {
  if (!element || element.querySelector('.drag-handle')) return;
  const handle = document.createElement('div');
  handle.className = 'drag-handle';
  handle.setAttribute('aria-label', 'Drag to move this control group');
  element.appendChild(handle);
}
