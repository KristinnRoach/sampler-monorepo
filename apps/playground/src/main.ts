import { defineSampler } from '@repo/audio-components';

defineSampler(); // Define all sampler components

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');

  document.addEventListener('click', function (e) {
    const target = e?.target as HTMLElement;

    if (target?.classList.contains('expandable-legend')) {
      target.closest('.control-group')?.classList.toggle('collapsed');
    }

    if (target?.classList.contains('row-collapse-icon')) {
      const row = parseInt(target.getAttribute('data-row') || '0');
      toggleRow(row);
    }
  });
});

function toggleRow(rowNumber: number) {
  const rowSelectors = [
    '.env-group, .sample-group, .mix-group, .distortion-group',
    '.filter-group, .reverb-group, .mod-group',
    '.loop-group, .trim-group, .feedback-group, .amp-lfo-group, .pitch-lfo-group',
    '.toggle-group, .keyboard-group',
  ];

  const groups = document.querySelectorAll(rowSelectors[rowNumber - 1]);
  const allCollapsed = Array.from(groups).every((g) =>
    g.classList.contains('collapsed')
  );

  groups.forEach((group) => group.classList.toggle('collapsed', !allCollapsed));
}

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
