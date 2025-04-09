// noise-processor.js
class RandomNoiseProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
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
