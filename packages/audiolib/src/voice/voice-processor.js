/**
 * Voice processor for handling smooth transitions between audio sources
 */
class VoiceProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'fadeDuration',
        defaultValue: 0.1,
        minValue: 0.001, 
        maxValue: 2.0,
        automationRate: 'k-rate'
      }
    ];
  }

  constructor() {
    super();
    
    // Transition state
    this.isTransitioning = false;
    this.transitionStartFrame = 0;
    this.transitionDurationFrames = 0;
    
    // Setup message handling
    this.port.onmessage = (event) => {
      if (event.data.type === 'transition') {
        this.startTransition(event.data.time, event.data.fadeDuration);
      }
      else if (event.data.type === 'start') {
        // Handle playback starting - could reset state if needed
      }
      else if (event.data.type === 'stop') {
        // Handle playback stopping - could reset state if needed
      }
    };
  }
  
  /**
   * Start a transition between audio sources
   * @param time AudioContext time when transition starts
   * @param fadeDuration Duration of crossfade in seconds
   */
  startTransition(time, fadeDuration) {
    // Convert time to frame index 
    const currentFrame = currentTime * sampleRate;
    const startFrame = time * sampleRate;
    
    this.isTransitioning = true;
    this.transitionStartFrame = startFrame;
    this.transitionDurationFrames = fadeDuration * sampleRate;
  }
  
  /**
   * Process audio by applying crossfades during transitions
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    // If no input channels, return silent output
    if (input.length === 0) {
      return true;
    }
    
    // Get current frame for transition calculation
    const currentFrame = currentTime * sampleRate;
    
    // Apply crossfade if transitioning
    if (this.isTransitioning) {
      // Calculate progress through transition (0-1)
      const transitionProgress = Math.min(
        1.0,
        (currentFrame - this.transitionStartFrame) / this.transitionDurationFrames
      );
      
      // Apply crossfade to all channels
      for (let channel = 0; channel < input.length && channel < output.length; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        
        for (let i = 0; i < inputChannel.length; i++) {
          // Linear crossfade between sources
          outputChannel[i] = inputChannel[i] * transitionProgress;
        }
      }
      
      // Check if transition is complete
      if (transitionProgress >= 1.0) {
        this.isTransitioning = false;
        
        // Notify main thread that transition is complete
        this.port.postMessage({
          type: 'transitionComplete'
        });
      }
    } else {
      // No transition, just pass audio through
      for (let channel = 0; channel < input.length && channel < output.length; channel++) {
        const inputChannel = input[channel];
        const outputChannel = output[channel];
        
        for (let i = 0; i < inputChannel.length; i++) {
          outputChannel[i] = inputChannel[i];
        }
      }
    }
    
    // Continue processing
    return true;
  }
}

// Register the processor
registerProcessor('voice-processor', VoiceProcessor);
