// index.ts - Entry point for all AudioWorklet processors

// Export all processor utilities
export * from './processor-utils';

// Re-export processor code
// The actual processor registration happens in the imported file
export * from './test-processor';

// Import JS version (note: JS files don't need explicit export since registration happens at import time)
import './js-test-processor';

import './sample-player-processor';

// Import buffer player processor
export * from './buffer-player-processor';
