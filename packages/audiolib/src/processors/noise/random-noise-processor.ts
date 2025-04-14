// @ts-check
/// <reference types="../../types/worklet" />

class RandomNoiseProcessor extends AudioWorkletProcessor {
  process(
    inputs: Float32Array[][],
    outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = Math.random() * 2 - 1;
      }
    });
    return true;
  }
}

registerProcessor('random-noise-processor', RandomNoiseProcessor);

// todo: check the difference, if any
// registerProcessor(
//   'noise-generator',
//   class extends AudioWorkletProcessor {
//     process(inputs, outputs) {
//       for (let i = 0; i < outputs[0][0].length; ++i)
//         outputs[0][0][i] = 2 * Math.random() - 1;
//       return true;
//     }
//   }
// );
