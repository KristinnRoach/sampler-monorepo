// DRAFT!! Test before deciding it's a good idea dewd

class PseudoAudioParam {
  constructor(targetObject, propertyName) {
    this.targetObject = targetObject; // Object containing the property
    this.propertyName = propertyName; // Property to control
    this.currentValue = targetObject[propertyName]; // Initial value
  }

  setValueAtTime(value, time) {
    const currentTime = this.targetObject.context.currentTime; // Assuming an AudioContext is available
    const delay = Math.max(0, (time - currentTime) * 1000); // Convert time to milliseconds
    setTimeout(() => {
      this.targetObject[this.propertyName] = value;
      this.currentValue = value;
    }, delay);
  }

  linearRampToValueAtTime(value, endTime) {
    const startTime = this.targetObject.context.currentTime; // Assuming an AudioContext is available
    const duration = Math.max(0, (endTime - startTime) * 1000); // Convert time to milliseconds
    const startValue = this.currentValue;
    const delta = value - startValue;

    const steps = Math.floor(duration / 10); // Number of interpolation steps
    let stepCount = 0;

    const intervalId = setInterval(() => {
      stepCount++;
      const progress = stepCount / steps;
      this.currentValue = startValue + delta * progress;
      this.targetObject[this.propertyName] = this.currentValue;

      if (stepCount >= steps) {
        clearInterval(intervalId);
        this.currentValue = value; // Ensure final value is set exactly
      }
    }, 10);
  }
}

// // Usage Example:
// const audioCtx = new AudioContext();
// const sourceNode = audioCtx.createBufferSource();

// sourceNode.loopEnd = 5; // Initial loopEnd value

// const pseudoLoopEnd = new PseudoAudioParam(sourceNode, 'loopEnd');

// // Schedule changes:
// pseudoLoopEnd.setValueAtTime(3, audioCtx.currentTime + 1); // Set loopEnd to 3 after 1 second
// pseudoLoopEnd.linearRampToValueAtTime(8, audioCtx.currentTime + 5); // Ramp loopEnd to 8 over 4 seconds
