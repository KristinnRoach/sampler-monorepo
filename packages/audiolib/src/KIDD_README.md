\*\* Pattern for implementing features:

nodes EXTEND BaseEventTarget AND BaseWorkletNode ??
TODO: DI or other patterns for implementing the needed base functionality, KISS!!

feature-x:

- x-actions: interface defining what the 'node' should be able to do, implementation agnostic
- x-node-base: default web audio implementation of the interface, implements BaseEventTarget AND BaseWorkletNode ??
- x-node-???: alternative implementations
- x-state: only state that is needed (if any) for the internal logic of "audiolib"
- x-utils: utility functions
- x-factory: Factory functions to export the nodes
- x-worklet-code: If custom worklet processor is needed
