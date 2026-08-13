import van, { State } from '@repo/vanjs-core';

const { button } = van.tags;

/**
 * Creates the envelope control buttons (enable, loop, sync)
 */
export const EnvToggleButtons = (
  enabled: State<boolean>,
  loopEnabled: State<boolean>,
  syncedToPlaybackRate: State<boolean>
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
      background: ${enabled.val ? '#4ade80' : '#666'};
    `,
    title: () => (enabled.val ? 'Disable envelope' : 'Enable envelope'),
    onclick: () => (enabled.val = !enabled.val),
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
      background: ${loopEnabled.val && enabled.val ? '#ff6b6b' : '#666'};
    `,
    title: () => (loopEnabled.val ? 'Disable looping' : 'Enable looping'),
    onclick: () => (loopEnabled.val = !loopEnabled.val),
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
      background: ${syncedToPlaybackRate.val && enabled.val ? '#336bcc' : '#666'};
    `,
    title: () => (syncedToPlaybackRate.val ? 'Disable sync' : 'Enable sync'),
    onclick: () => (syncedToPlaybackRate.val = !syncedToPlaybackRate.val),
  });

  return {
    enabledToggle,
    loopToggle,
    syncToggle,
  };
};
