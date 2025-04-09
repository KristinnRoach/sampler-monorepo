// // src/recorder/SampleRecorder.tsx
// import { createSignal, onMount, onCleanup, For } from 'solid-js';
// import {
//   createAudioRecorder,
//   AudioRecorder,
//   // AudioRecorderEvents as recEvent,
// } from

// /**
//  * Subscribable emitted events
//  * Usage: audioRecorder.addEventListener('recording:start', () => { ... }); // or AudioRecorderEvents.START
//  */
// const recEvent = {
//   START: 'recording:start',
//   STOP: 'recording:stop',
//   DATA: 'recording:data',
//   COMPLETE: 'recording:complete',
//   ERROR: 'recording:error',
// };

// const SampleRecorder = () => {
//   const [isRecording, setIsRecording] = createSignal(false);
//   const [recordings, setRecordings] = createSignal([]);
//   const [error, setError] = createSignal(null);
//   let recorder: AudioRecorder | null = null;

//   onMount(() => {
//     // Create recorder instance
//     recorder = createAudioRecorder();

//     // Set up event listeners
//     recorder.addEventListener(recEvent.START, () => {
//       setIsRecording(true);
//       setError(null);
//     });

//     recorder.addEventListener(recEvent.STOP, () => {
//       setIsRecording(false);
//     });

//     recorder.addEventListener(recEvent.COMPLETE, (event: CustomEvent) => {
//       const { blob } = event.detail;
//       const audioUrl = URL.createObjectURL(blob);

//       setRecordings((prev) => [
//         ...prev,
//         {
//           id: Date.now(),
//           url: audioUrl,
//           blob,
//         },
//       ]);
//     });

//     recorder.addEventListener(recEvent.ERROR, (event: CustomEvent) => {
//       // Todo: type CustomEvent
//       setError(event.detail.error.message || 'Recording failed');
//       setIsRecording(false);
//     });
//   });

//   onCleanup(() => {
//     // Clean up resources
//     if (recorder) {
//       recorder.dispose();
//     }

//     // Release object URLs
//     recordings().forEach((recording) => {
//       URL.revokeObjectURL(recording.url);
//     });
//   });

//   const toggleRecording = async () => {
//     try {
//       if (isRecording()) {
//         await recorder.stopRecording();
//       } else {
//         await recorder.startRecording();
//       }
//     } catch (e) {
//       setError(e.message || 'Recording operation failed');
//     }
//   };

//   const downloadRecording = (recording) => {
//     const a = document.createElement('a');
//     a.href = recording.url;
//     a.download = `recording-${recording.id}.webm`;
//     a.click();
//   };

//   const deleteRecording = (id) => {
//     setRecordings((prev) => {
//       const updated = prev.filter((recording) => recording.id !== id);
//       const removed = prev.find((recording) => recording.id === id);

//       if (removed) {
//         URL.revokeObjectURL(removed.url);
//       }

//       return updated;
//     });
//   };

//   return (
//     <div class='recorder-container'>
//       <h1>Audio Recorder</h1>

//       {error() && <div class='error-banner'>Error: {error()}</div>}

//       <div class='controls'>
//         <button
//           onClick={toggleRecording}
//           class={isRecording() ? 'recording' : ''}
//         >
//           {isRecording() ? 'Stop Recording' : 'Start Recording'}
//         </button>
//       </div>

//       <div class='recordings-list'>
//         <h2>Recordings</h2>
//         {recordings().length === 0 ? (
//           <p>No recordings yet</p>
//         ) : (
//           <ul>
//             <For each={recordings()}>
//               {(recording) => (
//                 <li>
//                   <audio src={recording.url} controls />
//                   <div class='recording-actions'>
//                     <button onClick={() => downloadRecording(recording)}>
//                       Download
//                     </button>
//                     <button onClick={() => deleteRecording(recording.id)}>
//                       Delete
//                     </button>
//                   </div>
//                 </li>
//               )}
//             </For>
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SampleRecorder;

// export const RecordButton = () => {
//   return (
//     <button
//       onClick={() => {
//         console.log('Recording button clicked');
//       }}
//     >
//       Record
//     </button>
//   );
// };
