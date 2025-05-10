# AudioWorkletProcessor Setup Guide for TypeScript and Vite

## Background

AudioWorkletProcessor runs in a separate thread with different capabilities than your main application. The main challenge is that standard ES module imports don't work as expected because:

1. The processor code runs in a separate context
2. TypeScript/Vite build processes need special configuration to handle this
3. All dependencies must be available in the processor context

## Solution Architecture

The solution involves:
1. Creating a separate build pipeline for processor code
2. Ensuring all dependencies are bundled together
3. Using a clean API for communication between main thread and worklet

## Setup Instructions

### 1. Project Structure

```
your-project/
├── src/
│   ├── audio/
│   │   ├── processors/
│   │   │   ├── index.ts         # Processor entry point
│   │   │   ├── my-processor.ts  # Individual processor
│   │   │   └── processor-utils.ts # Utils used by processors
│   │   └── main-audio.ts        # Main thread audio code
│   └── main.ts                  # Main application
├── public/
│   └── processors/              # Build output for processors
├── vite.config.ts               # Vite config
└── audioworklet-plugin.js       # Custom plugin
```

### 2. Create Vite Plugin

Create a file called `audioworklet-plugin.js` in your project root:

```javascript
// audioworklet-plugin.js
import { resolve } from 'path';
import { build } from 'vite';

export default function audioWorkletPlugin() {
  return {
    name: 'vite-audioworklet-plugin',
    
    // Build processors during dev server start and production build
    buildStart() {
      console.log('Building AudioWorklet processors...');
      
      // Trigger separate build for processor code
      build({
        configFile: false,
        build: {
          lib: {
            entry: resolve(__dirname, 'src/audio/processors/index.ts'),
            formats: ['es'],
            fileName: 'processors'
          },
          outDir: 'public/processors',
          emptyOutDir: true,
        },
        resolve: {
          // Add any special resolvers needed
        }
      });
    }
  };
}
```

### 3. Update Vite Config

Update your `vite.config.ts` to include the custom plugin:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import audioWorkletPlugin from './audioworklet-plugin';

export default defineConfig({
  plugins: [
    audioWorkletPlugin(),
    // other plugins...
  ],
  build: {
    // Your main build config
  }
});
```

### 4. Create Processor Entry Point

Create a file `src/audio/processors/index.ts` to serve as the entry point for all processor code:

```typescript
// src/audio/processors/index.ts
// Re-export all processors and utilities they need
export * from './my-processor';
export * from './processor-utils';

// You can also include shared constants, types, etc.
export const SAMPLE_RATE = 44100;
export type AudioProcessorMessage = {
  type: string;
  payload?: any;
};
```

### 5. Create Your Processor

```typescript
// src/audio/processors/my-processor.ts
import { AudioProcessorMessage } from './index'; // Import from your entry point
import { calculateSomething } from './processor-utils';

class MyProcessor extends AudioWorkletProcessor {
  private gain = 1.0;

  constructor() {
    super();
    // Set up message handling
    this.port.onmessage = this.handleMessage.bind(this);
  }

  handleMessage(event: MessageEvent<AudioProcessorMessage>) {
    const { type, payload } = event.data;
    
    if (type === 'setGain') {
      this.gain = payload;
    }
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
    // Process audio
    const input = inputs[0];
    const output = outputs[0];
    
    if (input && input.length > 0) {
      for (let channel = 0; channel < output.length; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        
        for (let i = 0; i < outputChannel.length; i++) {
          // Apply some processing using our utility
          outputChannel[i] = calculateSomething(inputChannel[i]) * this.gain;
        }
      }
    }
    
    return true; // Keep processor alive
  }
}

// Register the processor
registerProcessor('my-processor', MyProcessor);
```

### 6. Create Utilities

```typescript
// src/audio/processors/processor-utils.ts
// Any utilities needed by your processors

export function calculateSomething(sample: number): number {
  // Your audio processing logic
  return Math.tanh(sample); // Simple soft clipping example
}

export function createWindow(size: number): Float32Array {
  // Create a window function
  const window = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    // Hann window example
    window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
  }
  return window;
}
```

### 7. Main Thread Integration

```typescript
// src/audio/main-audio.ts
export async function setupAudio() {
  const audioContext = new AudioContext();
  
  // Wait for context to be running (needed for Safari)
  if (audioContext.state !== 'running') {
    await audioContext.resume();
  }
  
  // Load processor code
  try {
    await audioContext.audioWorklet.addModule('/processors/processors.js');
  } catch (error) {
    console.error('Failed to load audio processors:', error);
    throw error;
  }
  
  // Create node using your processor
  const workletNode = new AudioWorkletNode(audioContext, 'my-processor', {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    outputChannelCount: [2] // Stereo output
  });
  
  // Set up communication
  workletNode.port.onmessage = (event) => {
    console.log('Message from processor:', event.data);
  };
  
  // Example: Send a message to the processor
  function setGain(value: number) {
    workletNode.port.postMessage({
      type: 'setGain',
      payload: value
    });
  }
  
  // Connect to audio graph
  // source -> workletNode -> destination
  
  return {
    node: workletNode,
    setGain
  };
}
```

### 8. Usage in Main Application

```typescript
// src/main.ts or your component
import { setupAudio } from './audio/main-audio';

async function initializeAudio() {
  try {
    const audio = await setupAudio();
    // Store reference or set up UI controls
    document.querySelector('#gainSlider')?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      audio.setGain(value);
    });
  } catch (error) {
    console.error('Audio initialization failed:', error);
  }
}

// Call on user interaction (needed for browsers to allow audio)
document.querySelector('#startButton')?.addEventListener('click', initializeAudio);
```

## Important Notes

### Troubleshooting

1. **Missing Dependencies**: If you get errors about missing modules, ensure they're properly re-exported from your processor entry point.

2. **Context Errors**: Remember the AudioWorklet context has limited access to browser APIs. Don't use DOM APIs, localStorage, etc.

3. **CORS Issues**: During development, ensure your dev server properly serves the processor files with correct CORS headers.

### Performance Considerations

1. Avoid creating new objects in the `process` method to prevent garbage collection
2. Use typed arrays and avoid complex data structures
3. Consider using shared array buffers for large data transfers

### Alternative Approaches

For simpler cases, you can inline all processor code as a string and use a blob URL:

```typescript
const processorCode = `
  class MyProcessor extends AudioWorkletProcessor {
    // Your processor code
    process(inputs, outputs, parameters) {
      // Processing logic
      return true;
    }
  }
  registerProcessor('my-processor', MyProcessor);
`;

const blob = new Blob([processorCode], { type: 'application/javascript' });
const url = URL.createObjectURL(blob);
await audioContext.audioWorklet.addModule(url);
```

This approach works best for simple processors without dependencies.
