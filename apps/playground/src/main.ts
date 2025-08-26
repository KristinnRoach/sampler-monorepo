// main.ts
import { updateSW } from './utils/pwa-utils/updateSW';
import { defineSampler } from '@repo/audio-components';
import type { SamplerElement } from '@repo/audio-components';
import { addExpandCollapseListeners } from './utils/expandCollapse';
import { qs } from './utils/dom-utils';

defineSampler(); // Define all sampler components

// Simple layout manager
class LayoutManager {
  private grid: HTMLElement;
  private currentLayout = 'desktop';

  constructor() {
    this.grid = document.getElementById('sampler-container')!;
    this.initResponsive();
  }

  switchLayout(layout: 'desktop' | 'tablet' | 'mobile') {
    this.grid.className = `control-grid layout-${layout}`;
    this.currentLayout = layout;
    console.log(`Layout switched to: ${layout}`);
  }

  private initResponsive() {
    const checkSize = () => {
      const width = window.innerWidth;
      if (width < 600 && this.currentLayout !== 'mobile') {
        this.switchLayout('mobile');
      } else if (width >= 600 && width < 900 && this.currentLayout !== 'tablet') {
        this.switchLayout('tablet');
      } else if (width >= 900 && this.currentLayout !== 'desktop') {
        this.switchLayout('desktop');
      }
    };

    window.addEventListener('resize', checkSize);
    checkSize(); // Initial check
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize layout manager
  new LayoutManager();
  console.debug('playground initialized');

  const samplerEl = qs('sampler-element') as SamplerElement;
  let samplePlayer: any;

  document.addEventListener('sample-loaded', () => {
    samplePlayer = samplerEl.getSamplePlayer();
    // console.info(samplePlayer);
  });

  addExpandCollapseListeners();
});
