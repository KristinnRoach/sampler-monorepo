---
runme:
  id: 01JSQP3JR42NY49PRNCY2MZQ8X
  version: v3
---

# AudioWorklet Processor Utils Approach

This document outlines a proposed approach for sharing utility code between AudioWorklet processors.

## Problem

AudioWorklet processors cannot use regular module imports when running in their isolated context. We need a way to share common utilities between processors without duplicating code.

## Proposed Solution

Create a build-time injection system that bundles required utilities into each processor's code.

### 1. Create Shared Utilities File

```typescript {"id":"01JSQP3JR3285KT0NB93WES8GG"}
// processor-utils.ts
export const PROCESSOR_UTILS = {
  // Timing utilities
  PlaybackTiming: `
    class PlaybackTiming {
      constructor() {
        this.clear();
      }
      // ... implementation
    }
  `,

  // Constants
  Constants: `
    const MIN_ABS_AMPLITUDE = 0.0001;
  `,

  // Audio Math Utils
  AudioMath: `
    function midiNoteToFrequency(note) {
      return 440 * Math.pow(2, (note - 69) / 12);
    }
    
    function dbToGain(db) {
      return Math.pow(10, db / 20);
    }
  `,
};
```

### 2. Modify Code Generator

```typescript {"id":"01JSQP3JR3285KT0NB95ZY025G"}
// generateProcessorCode.ts
export function generateProcessorCode(
  { className, registryName },
  processFunc,
  params,
  options = {}
): string {
  const requestedUtils = options.utils || [];
  const utilsCode = requestedUtils
    .map((util) => PROCESSOR_UTILS[util])
    .filter(Boolean)
    .join('\n\n');

  return `
    // Injected utilities
    ${utilsCode}

    class ${className} extends AudioWorkletProcessor {
      // ... rest of processor code
    }
  `;
}
```

### 3. Usage in Processors

```typescript {"id":"01JSQP3JR3285KT0NB98HZ395D"}
// source-processor.ts
const processorCode = generateProcessorCode(
  { className, registryName },
  process,
  parameterDescriptors,
  {
    utils: ['Constants', 'PlaybackTiming', 'AudioMath'],
    constructorCode,
    messageHandler,
  }
);
```

```typescript {"id":"01JSQP6BMB77K7AZ8QH7SFC24G"}
// maybe useful

import { PROCESSOR_UTILS } from '@/nodes/processors/processor-utils';

export function generateProcessorCode(
  { className, registryName }: { className: string; registryName: string },
  processFunc: Function,
  params: AudioParamDescriptor[],
  options: {
    state?: Record<string, unknown>;
    constructorCode?: Function;
    messageHandler?: Function;
    utils?: string[]; // Array of utility names to include
  } = {}
): string {
  if (typeof processFunc !== 'function') {
    throw new Error('Process function must be a function');
  }

  // Generate utilities code block
  const requestedUtils = options.utils || [];
  const utilsCode = requestedUtils
    .map(util => PROCESSOR_UTILS[util])
    .filter(Boolean)
    .join('\n\n');

  const paramsJSON = JSON.stringify(params);
  let funcBody = processFunc.toString();
  funcBody = funcBody.substring(
    funcBody.indexOf('{') + 1,
    funcBody.lastIndexOf('}')
  );

  // Rest of your existing code...

  return `
        // Injected utilities
        ${utilsCode}

        class ${className} extends AudioWorkletProcessor {
          static get parameterDescriptors() {
            return ${paramsJSON};
          }
  
          constructor() {
            super();
            this.active = true;
            ${stateInit}
            ${messageHandler}
            ${extraConstructorCode}
          }
  
          process(inputs, outputs, parameters) {
            if (!this.active) return true;
            ${funcBody}
          }
        }
  
        registerProcessor("${registryName}", ${className});
      `;
}
```

## Benefits

- All utilities are inlined into final processor code
- Selective utility inclusion per processor
- Single source of truth for shared code
- No runtime imports in AudioWorklet context
- Easy to maintain and extend

## Implementation Notes

- Keep utility functions pure and self-contained
- Avoid external dependencies in utilities
- Consider minification for production builds
- Document each utility's purpose and usage
- Use TypeScript for better maintainability

## Future Considerations

- Add build step to validate utility code
- Create testing strategy for utilities
- Consider versioning for utilities
- Add development-only debugging utilities
- Create utility documentation generator

## Related Issues

- Current import failures in AudioWorklet context
- Code duplication between processors
- Maintenance overhead of scattered utility functions

## References

- [AudioWorklet Documentation](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
