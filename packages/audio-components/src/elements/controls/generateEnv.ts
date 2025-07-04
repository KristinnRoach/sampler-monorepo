import gsap from 'gsap';

export function generateGSAPEnvelope(
  type: 'bounce' | 'wiggle' | 'elastic',
  params: any
) {
  const timeline = gsap.timeline();
  const dummyObject = { value: 0 };
  const capturedValues: number[] = [];

  // Create GSAP animation with custom easing
  timeline.to(dummyObject, {
    value: 1,
    duration: 1, // Normalized to 1 second
    ease: 'bounce.out', // or "wiggle(10, 0.5)" etc
    // onUpdate: () => capturedValues.push(dummyObject.value)
  });

  // Play the timeline and capture all values
  timeline.play();

  return capturedValues; // Array of 0-1 values sampled at 60fps
}

// getEnvelopeData() {
//   return {
//     type: 'gsap-curve',
//     curveData: this.capturedGSAPValues, // Pre-generated array
//     sampleRate: 60, // GSAP runs at 60fps
//     loop: this.loop
//   };
// }
