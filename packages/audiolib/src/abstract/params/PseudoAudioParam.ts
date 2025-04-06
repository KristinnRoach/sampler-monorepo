// DRAFT!! Test before deciding it's a good idea dewd

export class PseudoAudioParam {
  targetNode: AudioBufferSourceNode; // for now only supports AudioBufferSourceNode
  context: BaseAudioContext;
  propertyName: 'loopStart' | 'loopEnd'; // or keyof AudioBufferSourceNode ??
  currentValue: number = 0; // temp 0

  constructor(
    targetNode: AudioBufferSourceNode,
    propertyName: 'loopStart' | 'loopEnd' // Property to control (e.g., 'loopStart', 'loopEnd')
  ) {
    this.targetNode = targetNode; // Object containing the property
    this.context = targetNode.context; // AudioContext for scheduling
    this.propertyName = propertyName; // Property to control
    this.currentValue = (targetNode[propertyName] as number) ?? 0; // Initial value
  }

  setValueAtTime(value: number, time: number): void {
    const currentTime = this.targetNode.context.currentTime; // Assuming an AudioContext is available
    const delay = Math.max(0, (time - currentTime) * 1000); // Convert time to milliseconds
    setTimeout(() => {
      this.targetNode[this.propertyName] = value;
      this.currentValue = value;
    }, delay);
  }

  linearRampToValueAtTime(value: number, rampDurationSec: number): void {
    // const startTime = this.targetNode.context.currentTime; // Assuming an AudioContext is available
    const durationMs = Math.max(0, rampDurationSec * 1000); // Convert time to milliseconds
    const startValue = this.currentValue;
    const delta = value - startValue;

    const steps = Math.floor(durationMs / 10); // Number of interpolation steps
    let stepCount = 0;

    console.log(
      `Ramping ${this.propertyName} from ${startValue} to ${value} over ${rampDurationSec} seconds`
    );

    const intervalId = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      this.currentValue = startValue + delta * progress;
      this.targetNode[this.propertyName] = this.currentValue;

      if (stepCount >= steps) {
        clearInterval(intervalId);
        this.currentValue = value; // Ensure final value is set exactly
        this.targetNode[this.propertyName] = value;

        console.log(
          `Final ${this.propertyName} set to ${this.currentValue} at time ${rampDurationSec}`
        );
      }
    }, 10); // testing how low we can go (ms)
  }
}

// // Usage Example:
// const audioCtx = new AudioContext();
// const sourceNode = audioCtx.createBufferSource();

// sourceNode.loopEnd = 5; // Initial loopEnd value

// const pseudoLoopEnd = new PseudoAudioParam(sourceNode, 'loopEnd');

// // Schedule changes:
// pseudoLoopEnd.setValueAtTime(3, audioCtx.currentTime + 1); // Set loopEnd to 3 after 1 second
// pseudoLoopEnd.linearRampToValueAtTime(8, audioCtx.currentTime + 4); // Ramp loopEnd to 8 over 4 seconds
