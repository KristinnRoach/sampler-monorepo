import { qs, qsa } from './utils';
import gsap from 'gsap';
import { makeDraggable } from './utils/makeDraggable';

import { defineSampler } from '@repo/audio-components';

defineSampler(); // Define all sampler components

// Function to animate sampler components entry
const animateSamplerEntry = () => {
  // Set initial state - target inner divs instead of custom elements
  gsap.set(
    '[target-node-id="test-sampler"] > div, computer-keyboard > *, piano-keyboard > *',
    {
      opacity: 0,
      scale: 0.75,
      y: 25,
      x: 0,
      // force3D: true, // Forces hardware acceleration
    }
  );

  // Create timeline for staggered animation
  const tl = gsap.timeline();

  // Animate main sampler element first
  tl.to('sampler-element > div', {
    opacity: 1,
    scale: 1,
    y: 0,
    x: 0,
    duration: 0.6,
    ease: 'back.out(1.7)',
  });

  // Animate control groups with stagger
  tl.to(
    '[target-node-id="test-sampler"] > div',
    {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      duration: 0.4,
      ease: 'back.out(1.7)',
      stagger: 0.05,
    },
    '-=0.3'
  );

  // Animate keyboards last
  tl.to(
    'computer-keyboard > *, piano-keyboard > *',
    {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      duration: 0.5,
      ease: 'back.out(1.7)',
      stagger: 0.2,
    },
    '-=0.1'
  );
};

function createAndAppendHandle(element: Element | null) {
  if (!element || element.querySelector('.drag-handle')) return;
  const handle = document.createElement('div');
  handle.className = 'drag-handle';
  handle.setAttribute('aria-label', 'Drag to move this control group');
  element.appendChild(handle);
}

function addDragHandles() {
  createAndAppendHandle(qs('.top-bar'));
  qsa('.control-group').forEach(createAndAppendHandle);
}

document.addEventListener('DOMContentLoaded', () => {
  console.debug('playground initialized');

  const samplerEl = qs('sampler-element');
  if (!samplerEl) {
    console.error('Sampler element not found');
    return;
  }

  // Listen for sampler errors (browser compatibility issues)
  document.addEventListener('sampler-error', (event: any) => {
    console.error('Sampler error:', event.detail);

    if (event.detail.error === 'AudioWorklet not supported') {
      // Create a browser compatibility warning
      const warning = document.createElement('div');
      if (document.querySelector('.browser-warning')) return;
      warning.className = 'browser-warning';
      warning.setAttribute('role', 'dialog');
      warning.setAttribute('aria-modal', 'true');

      // Create heading
      const heading = document.createElement('h2');
      heading.className = 'browser-warning__heading';
      heading.textContent = 'Browser Not Supported';
      const headingId = 'browser-warning__heading';
      heading.id = headingId;
      warning.setAttribute('aria-labelledby', headingId);

      // Create message paragraph
      const messagePara = document.createElement('p');
      messagePara.className = 'browser-warning__message';
      messagePara.textContent =
        event.detail.message || 'Your browser is not compatible.';

      // Create additional info paragraph
      const infoPara = document.createElement('p');
      infoPara.className = 'browser-warning__info';
      infoPara.textContent =
        'Your browser does not fully support AudioWorklet API.';

      // Create close button
      const closeButton = document.createElement('button');
      closeButton.className = 'browser-warning__button';
      closeButton.textContent = 'Close';

      // Add event listener to close button
      const removeWarning = () => {
        warning.remove();
        warning.removeEventListener('keydown', onKeydown);
      };
      const onKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') removeWarning();
      };
      warning.addEventListener('keydown', onKeydown);
      closeButton.addEventListener('click', removeWarning);

      // Append all elements to warning container
      warning.appendChild(heading);
      warning.appendChild(messagePara);
      warning.appendChild(infoPara);
      warning.appendChild(closeButton);

      document.body.appendChild(warning);
      // Move focus into dialog
      setTimeout(() => closeButton.focus(), 0);
    }
  });

  document.addEventListener('sampler-ready', () => {
    animateSamplerEntry();
    addDragHandles();
    const controlGroups = qsa('.control-group');
    const topBar = qs('.top-bar');
    if (topBar) {
      makeDraggable(
        {
          element: topBar,
          handleClassName: '.drag-handle',
        },
        {
          type: 'x,y',
        }
      );
    }

    controlGroups.forEach((element, i) => {
      gsap.to(element, {
        rotateX: 0,
        rotateY: 0,
        rotateZ: 0,
        ease: 'back.inOut',
      });

      makeDraggable(
        {
          element,
          handleClassName: '.drag-handle',
        },
        {
          type: 'x,y',
          onDragStart: () => {
            element.classList.add('dragging');
          },
          onDragEnd: () => {
            element.classList.remove('dragging');
          },
        }
      );
    });
  });
});
