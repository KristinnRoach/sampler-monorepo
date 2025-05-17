// index.ts - Entry point for all AudioWorklet processors

// Re-export processor code
// The actual processor registration happens in the imported file

// Note: JS files don't need explicit export since registration happens at import time
import './play/sample-player-processor';
import './gen/random-noise-processor';
import './fx/feedback-delay-processor';

// For dev de-bugging / testing:
// import './debug/js-test-processor.js';
// export * from './debug/ts-test-processor.js'; // ts version
// export * from './debug/buffer-player-processor.js'; // ts
