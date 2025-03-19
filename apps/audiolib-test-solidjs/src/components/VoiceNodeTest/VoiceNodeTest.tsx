// import { createSignal, onCleanup, onMount } from 'solid-js';
// import { VoiceNode } from '@repo/audiolib';
// import styles from './VoiceNodeTest.module.css';

// const VoiceNodeTest = () => {
//   const [audioContext, setAudioContext] = createSignal<AudioContext | null>(
//     null
//   );
//   const [voiceNode, setVoiceNode] = createSignal<VoiceNode | null>(null);
//   const [isPlaying, setIsPlaying] = createSignal(false);
//   const [midiNote, setMidiNote] = createSignal(60); // Middle C
//   const [audioBuffer, setAudioBuffer] = createSignal<AudioBuffer | null>(null);

//   onMount(async () => {
//     // Create audio context
//     const ctx = new AudioContext();
//     setAudioContext(ctx);

//     // Load a sample
//     try {
//       const response = await fetch('/audio/test-samples/c4.mp3');
//       const arrayBuffer = await response.arrayBuffer();
//       const buffer = await ctx.decodeAudioData(arrayBuffer);
//       setAudioBuffer(buffer);

//       // Create voice node with loaded buffer
//       const voice = new VoiceNode(ctx, buffer, ctx.destination, {
//         type: 'ADSR',
//         params: {
//           attackMs: 10,
//           decayMs: 100,
//           sustainLevel: 0.7,
//           releaseMs: 500,
//         },
//       });

//       setVoiceNode(voice);
//     } catch (error) {
//       console.error('Error loading sample:', error);
//     }
//   });

//   onCleanup(() => {
//     // Clean up audio resources
//     voiceNode()?.disconnect();
//     audioContext()?.close();
//   });

//   const handlePlayNote = () => {
//     const voice = voiceNode();
//     if (!voice) return;

//     if (!isPlaying()) {
//       voice.play(midiNote());
//       setIsPlaying(true);
//     } else {
//       voice.release();
//       setIsPlaying(false);
//     }
//   };

//   const handleSetLoop = (enabled: boolean) => {
//     voiceNode()?.setLoop(enabled, 0.2, 0.5);
//   };

//   const handleChangeNote = (event: Event) => {
//     const input = event.target as HTMLInputElement;
//     setMidiNote(parseInt(input.value, 10));
//   };

//   return (
//     <div class={styles.container}>
//       <h2>VoiceNode Test</h2>

//       <div class={styles.controls}>
//         <button
//           onClick={handlePlayNote}
//           disabled={!voiceNode()}
//           class={isPlaying() ? styles.activeButton : ''}
//         >
//           {isPlaying() ? 'Release' : 'Play Note'}
//         </button>

//         <div class={styles.sliderContainer}>
//           <label>MIDI Note: {midiNote()}</label>
//           <input
//             type='range'
//             min='36'
//             max='84'
//             value={midiNote()}
//             onInput={handleChangeNote}
//           />
//         </div>

//         <div class={styles.checkboxContainer}>
//           <label>
//             <input
//               type='checkbox'
//               onChange={(e) => handleSetLoop(e.target.checked)}
//             />
//             Enable Looping
//           </label>
//         </div>
//       </div>

//       <div class={styles.status}>
//         {!audioBuffer() ? (
//           <p>Loading sample...</p>
//         ) : (
//           <p>Sample loaded: {audioBuffer()?.duration.toFixed(2)}s</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default VoiceNodeTest;
