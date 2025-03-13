// GrainTest.jsx
import { createSignal, onMount, onCleanup } from 'solid-js';
import { GrainSamplerWorklet } from '@repo/grain';

// import { loadSound } from '@repo/grain'; // If this utility is exposed from your package

export default function GrainTest() {
  const [audioContext, setAudioContext] = createSignal(null);
  const [grainSampler, setGrainSampler] = createSignal(null);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isLoading, setIsLoading] = createSignal(true);
  const [errorMessage, setErrorMessage] = createSignal('');

  // Use direct imports instead of the packaged version for testing
  const initAudioEngine = async () => {
    try {
      setIsLoading(true);

      // Create context on user interaction
      const ctx = new window.AudioContext();
      setAudioContext(ctx);

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Load sample - use the method that matches your original working code
      const response = await fetch('/trimmed.wav');
      const arrayBuffer = await response.arrayBuffer();
      const sampleBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Create worklet exactly as in the working example
      const grainWorklet = new GrainSamplerWorklet(ctx, sampleBuffer);

      // Initialize with explicit error handling
      try {
        await grainWorklet.initialise();
      } catch (error) {
        console.error('Worklet initialization error:', error);
        throw new Error(`Worklet initialization failed: ${error.message}`);
      }

      // Connect the workletNode directly as in the working example
      grainWorklet.workletNode.connect(ctx.destination);

      setGrainSampler(grainWorklet);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      setErrorMessage(`Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  // Manual initialization on user interaction
  const handleInitialize = async () => {
    await initAudioEngine();
  };

  const handlePlay = () => {
    const sampler = grainSampler();
    if (sampler) {
      if (!isPlaying()) {
        sampler.enable();
        setIsPlaying(true);
      } else {
        sampler.disable();
        setIsPlaying(false);
      }
    }
  };

  const handleParamChange = (paramName, e) => {
    const sampler = grainSampler();
    if (sampler) {
      const value = parseFloat(e.target.value);
      sampler.setParamValueAtTime(paramName, value, audioContext().currentTime);
    }
  };

  onCleanup(() => {
    const sampler = grainSampler();
    if (sampler) {
      sampler.disconnect();
    }

    const ctx = audioContext();
    if (ctx) {
      ctx.close();
    }
  });

  return (
    <div class='granular-synth'>
      <h2>Granular Synthesizer</h2>

      {!audioContext() ? (
        <button onClick={handleInitialize}>Initialize Audio Engine</button>
      ) : isLoading() ? (
        <p>Loading audio engine...</p>
      ) : errorMessage() ? (
        <div class='error'>
          <p>{errorMessage()}</p>
          <p>Please try refreshing the page or check console for details.</p>
        </div>
      ) : (
        <>
          <button onClick={handlePlay} disabled={!grainSampler()}>
            {isPlaying() ? 'Stop' : 'Play'} Granular
          </button>

          <div class='controls'>
            <div class='control-group'>
              <label>
                Playback Position:
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  value='0'
                  onInput={(e) => handleParamChange('playbackPosition', e)}
                  disabled={!grainSampler()}
                />
              </label>
            </div>

            <div class='control-group'>
              <label>
                Density:
                <input
                  type='range'
                  min='1'
                  max='10'
                  step='0.1'
                  value='5'
                  onInput={(e) => handleParamChange('density', e)}
                  disabled={!grainSampler()}
                />
              </label>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// export default function GrainTest() {
//   const [audioContext, setAudioContext] = createSignal(null);
//   const [grainSampler, setGrainSampler] = createSignal(null);
//   const [isPlaying, setIsPlaying] = createSignal(false);
//   const [isLoading, setIsLoading] = createSignal(true);
//   const [errorMessage, setErrorMessage] = createSignal('');

//   // Load sample and create AudioBuffer
//   const loadSample = async (url) => {
//     try {
//       const response = await fetch(url);
//       const arrayBuffer = await response.arrayBuffer();
//       const audioBuffer = await audioContext().decodeAudioData(arrayBuffer);
//       return audioBuffer;
//     } catch (error) {
//       console.error('Error loading sample:', error);
//       throw error;
//     }
//   };

//   document.addEventListener(
//     'click',
//     async () => {
//       // First create the AudioContext - this must happen before any worklet operations
//       const ctx = new AudioContext();
//       setAudioContext(ctx);

//       await audioContext().resume();
//       await initGrainSampler();
//     },
//     { once: true }
//   );

//   onMount(async () => {
//     try {
//       setIsLoading(true);
//     } catch (error) {
//       console.error('Failed to initialize audio:', error);
//       setErrorMessage(`Error: ${error.message}`);
//       setIsLoading(false);
//     }
//   });

//   async function initGrainSampler() {
//     // AudioContext might be in suspended state if created before user interaction
//     if (audioContext().state === 'suspended') {
//       await audioContext().resume();
//     }

//     // Load sample first
//     const sampleBuffer = await loadSample('/trimmed.wav');

//     // Create the grain sampler with the buffer
//     const sampler = new GrainSamplerWorklet(audioContext(), sampleBuffer);

//     // Now we must call initialise() to register the worklet processor
//     // This is an async operation that must complete before we can use the worklet
//     await sampler.initialise();

//     // Connect to audio output
//     sampler.connect(audioContext().destination);

//     setGrainSampler(sampler);
//     setIsLoading(false);
//   }

//   onCleanup(() => {
//     // Cleanup audio resources
//     const sampler = grainSampler();
//     if (sampler) {
//       sampler.disconnect();
//     }

//     // Close AudioContext to free up resources
//     const ctx = audioContext();
//     if (ctx) {
//       ctx.close();
//     }
//   });

//   const handlePlay = () => {
//     const sampler = grainSampler();
//     if (sampler) {
//       if (!isPlaying()) {
//         // Enable the processor (this starts audio processing)
//         sampler.enable();
//         setIsPlaying(true);
//       } else {
//         // Disable the processor (this stops audio processing)
//         sampler.disable();
//         setIsPlaying(false);
//       }
//     }
//   };

//   // Control for parameters
//   const handleParamChange = (paramName, e) => {
//     const sampler = grainSampler();
//     if (sampler) {
//       const value = parseFloat(e.target.value);
//       sampler.setParamValueAtTime(paramName, value);
//     }
//   };

//   return (
//     <div class='granular-synth'>
//       <h2>Granular Synthesizer</h2>

//       {isLoading() ? (
//         <p>Loading audio engine...</p>
//       ) : errorMessage() ? (
//         <div class='error'>
//           <p>{errorMessage()}</p>
//           <p>Please try refreshing the page or check console for details.</p>
//         </div>
//       ) : (
//         <>
//           <button onClick={handlePlay} disabled={!grainSampler()}>
//             {isPlaying() ? 'Stop' : 'Play'} Granular
//           </button>

//           <div class='controls'>
//             <div class='control-group'>
//               <label>
//                 Playback Position:
//                 <input
//                   type='range'
//                   min='0'
//                   max='1'
//                   step='0.01'
//                   value='0'
//                   onInput={(e) => handleParamChange('playbackPosition', e)}
//                   disabled={!grainSampler()}
//                 />
//               </label>
//             </div>

//             <div class='control-group'>
//               <label>
//                 Density:
//                 <input
//                   type='range'
//                   min='1'
//                   max='10'
//                   step='0.1'
//                   value='5'
//                   onInput={(e) => handleParamChange('density', e)}
//                   disabled={!grainSampler()}
//                 />
//               </label>
//             </div>

//             <div class='control-group'>
//               <label>
//                 Mix:
//                 <input
//                   type='range'
//                   min='0'
//                   max='1'
//                   step='0.01'
//                   value='0.3'
//                   onInput={(e) => handleParamChange('mix', e)}
//                   disabled={!grainSampler()}
//                 />
//               </label>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }
