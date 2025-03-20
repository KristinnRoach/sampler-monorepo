## Naming convention needed to work for extending WorkletNode:

- processor js file: some-processor.js

  - class name: SomeProcessor extends AudioWorkletProcessor
  - file ends with: registerProcessor('some-processor', SomeProcessor);

- worklet node ts file: SomeWorkletNode.ts

These naming conventions are required by WorkletNode.ts in Audiolib, 20.03.2025 - kidd
