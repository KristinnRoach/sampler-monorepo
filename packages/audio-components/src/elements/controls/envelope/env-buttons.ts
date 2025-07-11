import van, { State } from '@repo/vanjs-core';

const { button } = van.tags;

/**
 * Creates the envelope control buttons (enable, loop, sync)
 */
export const createEnvelopeControlButtons = (
  isEnabled: State<boolean>,
  isLooping: State<boolean>,
  syncToPlaybackRate: State<boolean>
) => {
  const enabledToggle = button({
    style: () => `
      position: absolute; 
      top: 4px; 
      right: 4px; 
      width: 16px; 
      height: 16px; 
      border: none; 
      border-radius: 50%; 
      cursor: pointer; 
      z-index: 10;
      background: ${isEnabled.val ? '#4ade80' : '#666'};
    `,
    title: () => (isEnabled.val ? 'Disable envelope' : 'Enable envelope'),
    onclick: () => {
      isEnabled.val = !isEnabled.val;
    },
  });

  const loopToggle = button({
    style: () => `
      position: absolute; 
      top: 4px; 
      right: 24px; 
      width: 16px; 
      height: 16px; 
      border: none; 
      border-radius: 50%; 
      cursor: pointer; 
      z-index: 10;
      background: ${isLooping.val && isEnabled.val ? '#ff6b6b' : '#666'};
    `,
    title: () => (isLooping.val ? 'Disable looping' : 'Enable looping'),
    onclick: () => {
      if (isEnabled.val) isLooping.val = !isLooping.val;
    },
  });

  const syncToggle = button({
    style: () => `
      position: absolute; 
      top: 4px; 
      right: 44px;  
      width: 16px; 
      height: 16px; 
      border: none; 
      border-radius: 50%; 
      cursor: pointer; 
      z-index: 10;
      background: ${syncToPlaybackRate.val && isEnabled.val ? '#336bcc' : '#666'};
    `,
    title: () => (syncToPlaybackRate.val ? 'Disable sync' : 'Enable sync'),
    onclick: () => {
      if (isEnabled.val) syncToPlaybackRate.val = !syncToPlaybackRate.val;
    },
  });

  return {
    enabledToggle,
    loopToggle,
    syncToggle,
  };
};
