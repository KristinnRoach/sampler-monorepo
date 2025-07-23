// registerProcessor(
//   'karplus-fb-delay-processor',
//   class extends AudioWorkletProcessor {
//     static get parameterDescriptors() {
//       return [
//         { name: 'gain', defaultValue: 0.9, minValue: -1, maxValue: 1 },
//         { name: 'delayTime', defaultValue: 10, minValue: 0, maxValue: 1000 },
//       ];
//     }
//     constructor() {
//       super();
//       this.Buffer = new Array(48000).fill(0);
//       (this.ReadPtr = 0), (this.WritePtr = 0);
//     }
//     process(inputs, outputs, parameters) {
//       let delaySamples = Math.round(
//           (sampleRate * parameters.delayTime[0]) / 1000
//         ),
//         bufferSize = this.Buffer.length;
//       for (let i = 0; i < outputs[0][0].length; ++i) {
//         outputs[0][0][i] =
//           parameters.gain[0] * this.Buffer[this.ReadPtr] + inputs[0][0][i];
//         this.Buffer[this.WritePtr] = outputs[0][0][i];
//         this.WritePtr++;
//         if (this.WritePtr >= bufferSize)
//           this.WritePtr = this.WritePtr - bufferSize;
//         this.ReadPtr = this.WritePtr - delaySamples;
//         if (this.ReadPtr < 0) this.ReadPtr = this.ReadPtr + bufferSize;
//       }
//       return true;
//     }
//   }
// );

registerProcessor(
  'karplus-fb-delay-processor',
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: 'gain',
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: 'k-rate',
        },
        {
          name: 'delayTime',
          defaultValue: 10,
          minValue: 0,
          maxValue: 1000,
          automationRate: 'k-rate',
        },
      ];
    }
    constructor() {
      super();
      this.Buffer = new Array(48000).fill(0);
      (this.ReadPtr = 0), (this.WritePtr = 0);
      this.maxOutput = 0.5;
    }
    process(inputs, outputs, parameters) {
      let delaySamples = Math.round(
          (sampleRate * parameters.delayTime[0]) / 1000
        ),
        bufferSize = this.Buffer.length;

      const maxOut = 1;

      for (let i = 0; i < outputs[0][0].length; ++i) {
        let sample =
          parameters.gain[0] * this.Buffer[this.ReadPtr] + inputs[0][0][i];

        // sample = maxOut * Math.tanh(sample / maxOut); // Soft limiting using tanh (more expensive)
        sample = Math.max(-maxOut, Math.min(maxOut, sample)); // Simple hard clipping (cheaper)

        outputs[0][0][i] = sample;

        this.Buffer[this.WritePtr] = outputs[0][0][i];
        this.WritePtr++;
        if (this.WritePtr >= bufferSize)
          this.WritePtr = this.WritePtr - bufferSize;
        this.ReadPtr = this.WritePtr - delaySamples;
        if (this.ReadPtr < 0) this.ReadPtr = this.ReadPtr + bufferSize;
      }
      return true;
    }
  }
);
