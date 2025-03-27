// First either create the full processor file "some-processor.js" and call registerFromPath

// or

// create a process function, params: AudioParamDescriptor[], and processorOptions: Record<string, unknown>,
// before registering

// then create the worklet node with the audiocontext, processor name and optional AudioWorkletNodeOptions
