// processFunction-template.ts
/**
 * Interface for the processor's state
 * Extend this interface for your specific processor's state
 */
export interface AudioWorkletProcessorState {
  active: boolean;
  [key: string]: any; // Allow additional properties
}

/**
 * Template for creating a process function for audio worklet processors
 *
 * @param inputs - Array of inputs, each containing arrays of channels with Float32Array samples
 * @param outputs - Array of outputs to write to, same structure as inputs
 * @param parameters - Object containing automation parameters as Float32Arrays
 * @returns Boolean indicating whether the processor should continue running
 */
export function createProcessFunction<
  T extends AudioWorkletProcessorState = AudioWorkletProcessorState,
>(
  processingLogic: (options: {
    // Input samples for a specific channel
    inputSample: number;
    // Current output sample for a specific channel
    outputSample: number;
    // Current sample index
    sampleIndex: number;
    // Current channel index
    channelIndex: number;
    // All parameters with correct values for current sample
    paramValues: Record<string, number>;
    // Access to processor's 'this' context for state
    processorState: T;
  }) => number
) {
  return function (
    this: T,
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ) {
    // Get first input and output (most common case)
    const input = inputs[0] || [];
    const output = outputs[0] || [];

    // Copy channel count from input, or use output channel count if no input
    const channelCount = Math.max(input.length, output.length);

    // Get all parameter values, properly handling a-rate and k-rate
    const paramValues: Record<string, number[]> = {};

    // Preprocess parameters to handle both a-rate and k-rate parameters
    for (const [name, paramArray] of Object.entries(parameters)) {
      // For k-rate parameters, we only need the first value
      // For a-rate, we need all values
      paramValues[name] =
        paramArray.length === 1
          ? Array(128).fill(paramArray[0]) // k-rate (constant for the block)
          : Array.from(paramArray); // a-rate (per-sample values)
    }

    // Process each channel
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      const inputChannel = input[channelIndex] || new Float32Array(128);
      const outputChannel = output[channelIndex] || new Float32Array(128);

      // Process each sample
      for (
        let sampleIndex = 0;
        sampleIndex < outputChannel.length;
        sampleIndex++
      ) {
        // Get current parameter values for this sample
        const currentParamValues: Record<string, number> = {};
        for (const [name, values] of Object.entries(paramValues)) {
          currentParamValues[name] = values[sampleIndex];
        }
        outputChannel[sampleIndex] = processingLogic({
          inputSample: inputChannel[sampleIndex] || 0,
          outputSample: outputChannel[sampleIndex],
          sampleIndex,
          channelIndex,
          paramValues: currentParamValues,
          processorState: this,
        });
      }
    }

    return true;
  };
}
