// index.ts - Entry point for all AudioWorklet processors

// Re-export processor code
// The actual processor registration happens in the imported file

// Note: JS files don't need explicit export since registration happens at import time
// (.js not necessary, just for clarity)
import './play/sample-player-processor.js';
import './gen/random-noise-processor.js';
import './fx/feedback-delay-processor.js';

// For dev de-bugging / testing:
import './debug/js-test-processor.js';
export * from './debug/ts-test-processor.js'; // ts version
export * from './debug/buffer-player-processor.js'; // ts
