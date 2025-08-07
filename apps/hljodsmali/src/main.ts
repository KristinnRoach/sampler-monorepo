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
      warning.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 10000;
        max-width: 90%;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      warning.innerHTML = `
        <h2 style="margin: 0 0 10px 0;">Browser Not Supported</h2>
        <p style="margin: 10px 0;">${event.detail.message}</p>
        <p style="margin: 10px 0; font-size: 0.9em;">Your browser does not fully support AudioWorklet API.</p>
        <button onclick="this.parentElement.remove()" style="
          background: white;
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        ">Close</button>
      `;
      document.body.appendChild(warning);
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

      // Make draggable with handle and callbacks
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
