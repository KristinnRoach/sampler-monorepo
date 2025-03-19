## Naming convention needed to work for extending WorkletNode:

- processor js file: some-processor.js

  - class name: SomeProcessor extends AudioWorkletProcessor
  - file ends with: registerProcessor('some-processor', SomeProcessor);

- worklet node ts file: SomeWorklet.ts

These naming conventions are required by WorkletNode.ts in Audiolib, 15.03.2025 - kidds
