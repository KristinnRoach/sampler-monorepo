import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import {
  createSingleSamplePlayer,
  SingleSamplePlayer,
  SingleSamplePlayerProps,
  loadAudioSample,
} from '@repo/audiolib';

export default function TestSingleSamplePlayer() {
  const [player, setPlayer] = createSignal<SingleSamplePlayer | null>(null);
  const [polyphony, setPolyphony] = createSignal(16);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [volume, setVolume] = createSignal(0.8);
  const [activeVoices, setActiveVoices] = createSignal(0);
  const [playbackPosition, setPlaybackPosition] = createSignal(0);
  const [isPlaying, setIsPlaying] = createSignal(false);
  const [sampleDuration, setSampleDuration] = createSignal(0);
  const [currentTime, setCurrentTime] = createSignal('0:00');

  const [loopEnabled, setLoopEnabled] = createSignal(false);
  const [loopStart, setLoopStart] = createSignal(0);
  const [loopEnd, setLoopEnd] = createSignal(0);
  const [rampDuration, setRampDuration] = createSignal(0);

  // Reference to track active voices
  let voiceCountInterval: number | undefined;

  const [lastEvent, setLastEvent] = createSignal('No events yet');

  // Event handlers

  const handleSetLoopStart = (value: number) => {
    const currentPlayer = player();
    const rampTime = rampDuration();
    if (currentPlayer) {
      currentPlayer.setLoopPoint('loopStart', value, rampTime);
      setLoopStart(value);
    }
  };
  const handleSetLoopEnd = (value: number) => {
    const currentPlayer = player();
    const rampTime = rampDuration();
    if (currentPlayer) {
      currentPlayer.setLoopPoint('loopEnd', value, rampTime);
      setLoopEnd(value);
    }
  };

  const handleEnableLoop = () => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.setLoopEnabled(true);
      setLoopEnabled(true);
    }
  };
  const handleDisableLoop = () => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.setLoopEnabled(false);
      setLoopEnabled(false);
    }
  };

  const handleNoteOn = (data: any) => {
    const { publisherId, note } = data;
    console.log('Note on:', publisherId, note);
    setLastEvent(`Voice ${publisherId} started - Note: ${note}`);
    setIsPlaying(true);
  };

  const handleNoteOff = (data: any) => {
    const { publisherId, releaseTime } = data;
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.releaseNote(releaseTime);
    }
    console.log('Note off:', publisherId);
    setLastEvent(`Voice ${publisherId} ended`);
  };

  const handleError = (data: any) => {
    const { publisherId, message } = data;
    console.error('Error:', publisherId, message);
    setLastEvent(`Error in voice ${publisherId}: ${message}`);
  };

  const handleSilence = (data: any) => {
    console.log('Silence:', data);
    setLastEvent(`All voices ended`);
    setIsPlaying(false);
  };

  onMount(async () => {
    try {
      // Load sample
      const samplePath = '/audio/test-samples/c4.mp3';
      const audioBuffer = await loadAudioSample(samplePath);

      // Store sample duration for display
      setSampleDuration(audioBuffer.duration);

      const props: SingleSamplePlayerProps = {
        name: 'piano',
        sampleBuffer: audioBuffer,
        polyphony: polyphony(),
        rootNote: 60, // Middle C
        addInputHandlers: true,
      };

      // Create player with position tracking callback
      const samplePlayer = await createSingleSamplePlayer(props);

      // Update state
      setPlayer(samplePlayer);
      setIsLoaded(true);

      // Subscribe to events - the piano ID will help us filter
      samplePlayer.addListener('note:on', handleNoteOn);
      samplePlayer.addListener('note:off', handleNoteOff);
      samplePlayer.addListener('error', handleError);

      // on(EVENTS.VOICE.ENDED, handleVoiceEnded);
      // on(EVENTS.SAMPLE.ALL_VOICES_ENDED, handleAllVoicesEnded);

      // // Set up voice count monitoring
      // voiceCountInterval = setInterval(() => {
      //   if (samplePlayer) {
      //     setActiveVoices(samplePlayer.getActiveVoiceCount());

      //     // Update playing state
      //     if (samplePlayer.getActiveVoiceCount() === 0) {
      //       setIsPlaying(false);
      //     }
      //   }
      // }, 100);
    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
  });

  onCleanup(() => {
    // Clean up interval and player resources
    if (voiceCountInterval) {
      clearInterval(voiceCountInterval);
    }

    // todo: Unsubscribe from events in the players dispose method

    // off(EVENTS.VOICE.STARTED, handleNoteOn);
    // off(EVENTS.VOICE.ENDED, handleNoteOff);
    // off(EVENTS.SAMPLE.ALL_VOICES_ENDED, handleSilence);

    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.dispose();
    }
  });

  // Update volume when slider changes
  createEffect(() => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.setVolume(volume());
    }
  });

  const handlePlayNote = (midiNote: number) => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.playNote(midiNote, 1.0);
      // console.log('Playing note:', midiNote);
      setIsPlaying(true);
    } else {
      console.error('there is no currentPlayer');
    }
  };

  const handleStopAll = () => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.stopAll(0.1);
      setIsPlaying(false);
    }
  };

  // Format duration for display
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Piano keyboard notes (one octave)
  const notes = [
    { name: 'C4', midi: 60 },
    { name: 'C#4', midi: 61 },
    { name: 'D4', midi: 62 },
    { name: 'D#4', midi: 63 },
    { name: 'E4', midi: 64 },
    { name: 'F4', midi: 65 },
    { name: 'F#4', midi: 66 },
    { name: 'G4', midi: 67 },
    { name: 'G#4', midi: 68 },
    { name: 'A4', midi: 69 },
    { name: 'A#4', midi: 70 },
    { name: 'B4', midi: 71 },
    { name: 'C5', midi: 72 },
  ];

  return (
    <div class='p-4 max-w-xl mx-auto'>
      <h1 class='text-2xl font-bold mb-4'>Single Sample Player Test</h1>

      <div class='mb-6'>
        <div class='flex items-center justify-between mb-2'>
          <div>Status: {isLoaded() ? 'Loaded' : 'Loading...'}</div>
          <div>
            Active Voices: {activeVoices()}/{polyphony()}
          </div>
        </div>

        {/* Enhanced position visualization */}
        <div class='mb-4'>
          <div class='flex justify-between text-sm mb-1'>
            <span>
              Position: {currentTime()} / {formatDuration(sampleDuration())}
            </span>
            <span class='font-semibold'>
              {isPlaying() ? 'Playing' : 'Stopped'}
            </span>
          </div>

          <div class='relative w-full h-8 bg-gray-200 rounded overflow-hidden'>
            {/* Progress bar */}
            <div
              class='h-full bg-blue-500 transition-all'
              style={{ width: `${playbackPosition() * 100}%` }}
            />

            {/* Position indicator (marker) */}
            <div
              class='absolute top-0 h-full w-1 bg-white transform -translate-x-1/2'
              style={{ left: `${playbackPosition() * 100}%` }}
            >
              <div class='absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-700 rounded-full'></div>
            </div>

            {/* Percentage indicator */}
            <div class='absolute inset-0 flex items-center justify-center text-sm font-bold text-white'>
              {Math.round(playbackPosition() * 100)}%
            </div>
          </div>
        </div>

        <div class='mb-4'>
          <label class='block mb-2'>Volume</label>
          <input
            type='range'
            min='0'
            max='1'
            step='0.01'
            value={volume()}
            onInput={(e) =>
              setVolume(parseFloat((e.target as HTMLInputElement).value))
            }
            class='w-full'
            disabled={!isLoaded()}
          />

          <div class='text-right'>{(volume() * 100).toFixed(0)}%</div>

          <label class='block mb-2'>Loop Start</label>

          <input
            type='range'
            min='0'
            max={sampleDuration() / 4}
            step='0.005'
            value={loopStart()}
            onInput={(e) =>
              handleSetLoopStart(
                parseFloat((e.target as HTMLInputElement).value)
              )
            }
            class='w-full'
            disabled={!isLoaded() || !loopEnabled()}
          />

          <div class='text-right'>{loopStart().toFixed(2)}s</div>

          <label class='block mb-2'>Loop End</label>

          <input
            type='range'
            min={loopStart()}
            max={sampleDuration() / 4}
            step='0.005'
            value={loopEnd()}
            onInput={(e) =>
              handleSetLoopEnd(parseFloat((e.target as HTMLInputElement).value))
            }
            class='w-full'
            disabled={!isLoaded() || !loopEnabled()}
          />
          <div class='text-right'>{loopEnd().toFixed(2)}s</div>

          <label class='block mb-2'>Ramp Duration</label>
          <input
            type='range'
            min='0'
            max='0.5'
            step='0.01'
            value={rampDuration()}
            onInput={(e) =>
              setRampDuration(parseFloat((e.target as HTMLInputElement).value))
            }
            class='w-full'
            disabled={!isLoaded() || !loopEnabled()}
          />

          <div class='text-right'>{rampDuration().toFixed(2)}s</div>
        </div>

        <button
          onClick={handleStopAll}
          disabled={!isLoaded()}
          class='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50'
        >
          Stop All
        </button>

        <button
          onClick={handleEnableLoop}
          disabled={!isLoaded() || loopEnabled()}
          class='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50'
        >
          Enable Looping
        </button>
        <button
          onClick={handleDisableLoop}
          disabled={!isLoaded() || !loopEnabled()}
          class='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50'
        >
          Disable Looping
        </button>
      </div>

      <div class='mb-4'>
        <h2 class='text-xl font-semibold mb-2'>Keyboard</h2>
        <div class='flex relative h-48'>
          {notes.map((note) => (
            <div class='relative flex-1'>
              <button
                onClick={() => handlePlayNote(note.midi)}
                disabled={!isLoaded()}
                class={`
                  absolute inset-0 border border-gray-300 
                  ${
                    note.name.includes('#')
                      ? 'bg-gray-800 text-white h-2/3 z-10 w-2/3 -mx-1/3'
                      : 'bg-white text-black h-full'
                  }
                  hover:bg-blue-100 disabled:opacity-50
                  flex items-end justify-center pb-2
                `}
              >
                {note.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div class='mt-6 text-sm text-gray-600'>{lastEvent().toString()}</div>
    </div>
  );
}

// import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
// import {
//   createSingleSamplePlayer,
//   SingleSamplePlayer,
//   loadAudioSample,
// } from '@repo/audiolib';

// // Define interface for the SingleSamplePlayer
// interface SingleSamplePlayer {
//   connect: (destination: AudioNode) => void;
//   play: (midiNote: number, velocity: number) => void;
//   stopAll: (releaseTime: number) => void;
//   dispose: () => void;
//   setVolume: (volume: number) => void;
//   getActiveVoiceCount: () => number;
// }

// export default function TestSingleSamplePlayer() {
//   const [player, setPlayer] = createSignal<SingleSamplePlayer | null>(null);
//   const [polyphony, setPolyphony] = createSignal(16);
//   const [isLoaded, setIsLoaded] = createSignal(false);
//   const [volume, setVolume] = createSignal(0.8);
//   const [activeVoices, setActiveVoices] = createSignal(0);
//   const [playbackPosition, setPlaybackPosition] = createSignal(0);

//   // Reference to track active voices
//   let voiceCountInterval: number | undefined;

//   onMount(async () => {
//     try {
//       // Load sample
//       const samplePath = '/audio/test-samples/c4.mp3';
//       const audioBuffer = await loadAudioSample(samplePath);

//       // Create player
//       const samplePlayer = (await createSingleSamplePlayer(
//         'piano',
//         audioBuffer,
//         {
//           polyphony: 16,
//           rootNote: 60, // Middle C
//         },
//         (position: number, normalized: number) => {
//           setPlaybackPosition(normalized);
//         }
//       )) as SingleSamplePlayer;

//       // Update state
//       setPlayer(samplePlayer);
//       setIsLoaded(true);

//       // Set up voice count monitoring
//       voiceCountInterval = setInterval(() => {
//         if (samplePlayer) {
//           setActiveVoices(samplePlayer.getActiveVoiceCount());
//         }
//       }, 100);
//     } catch (error) {
//       console.error('Failed to initialize player:', error);
//     }
//   });

//   onCleanup(() => {
//     // Clean up interval and player resources
//     if (voiceCountInterval) {
//       clearInterval(voiceCountInterval);
//     }

//     const currentPlayer = player();
//     if (currentPlayer) {
//       currentPlayer.dispose();
//     }
//   });

//   // Update volume when slider changes
//   createEffect(() => {
//     const currentPlayer = player();
//     if (currentPlayer) {
//       currentPlayer.setVolume(volume());
//     }
//   });

//   const handlePlayNote = (midiNote: number) => {
//     const currentPlayer = player();
//     if (currentPlayer) {
//       currentPlayer.play(midiNote, 1.0);
//     }
//   };

//   const handleStopAll = () => {
//     const currentPlayer = player();
//     if (currentPlayer) {
//       currentPlayer.stopAll(0.1);
//     }
//   };

//   // Piano keyboard notes (one octave)
//   const notes = [
//     { name: 'C4', midi: 60 },
//     { name: 'C#4', midi: 61 },
//     { name: 'D4', midi: 62 },
//     { name: 'D#4', midi: 63 },
//     { name: 'E4', midi: 64 },
//     { name: 'F4', midi: 65 },
//     { name: 'F#4', midi: 66 },
//     { name: 'G4', midi: 67 },
//     { name: 'G#4', midi: 68 },
//     { name: 'A4', midi: 69 },
//     { name: 'A#4', midi: 70 },
//     { name: 'B4', midi: 71 },
//     { name: 'C5', midi: 72 },
//   ];

//   return (
//     <div class='p-4 max-w-xl mx-auto'>
//       <h1 class='text-2xl font-bold mb-4'>Single Sample Player Test</h1>

//       <div class='mb-6'>
//         <div class='flex items-center justify-between mb-2'>
//           <div>Status: {isLoaded() ? 'Loaded' : 'Loading...'}</div>
//           <div>
//             Active Voices: {activeVoices()}/{polyphony()}
//           </div>
//         </div>

//         {/* Position visualization */}
//         <div class='mb-4'>
//           <div class='flex justify-between text-sm mb-1'>
//             <span>Position:</span>
//             <span>{Math.round(playbackPosition() * 100)}%</span>
//           </div>
//           <div class='w-full h-2 bg-gray-200 rounded overflow-hidden'>
//             <div
//               class='h-full bg-blue-500 transition-all duration-100'
//               style={{ width: `${playbackPosition() * 100}%` }}
//             />
//           </div>
//         </div>

//         <div class='mb-4'>
//           <label class='block mb-2'>Volume</label>
//           <input
//             type='range'
//             min='0'
//             max='1'
//             step='0.01'
//             value={volume()}
//             onInput={(e) =>
//               setVolume(parseFloat((e.target as HTMLInputElement).value))
//             }
//             class='w-full'
//             disabled={!isLoaded()}
//           />
//           <div class='text-right'>{(volume() * 100).toFixed(0)}%</div>
//         </div>

//         <button
//           onClick={handleStopAll}
//           disabled={!isLoaded()}
//           class='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50'
//         >
//           Stop All
//         </button>
//       </div>

//       <div class='mb-4'>
//         <h2 class='text-xl font-semibold mb-2'>Keyboard</h2>
//         <div class='flex relative h-48'>
//           {notes.map((note) => (
//             <div class='relative flex-1'>
//               <button
//                 onClick={() => handlePlayNote(note.midi)}
//                 disabled={!isLoaded()}
//                 class={`
//                   absolute inset-0 border border-gray-300
//                   ${
//                     note.name.includes('#')
//                       ? 'bg-gray-800 text-white h-2/3 z-10 w-2/3 -mx-1/3'
//                       : 'bg-white text-black h-full'
//                   }
//                   hover:bg-blue-100 disabled:opacity-50
//                   flex items-end justify-center pb-2
//                 `}
//               >
//                 {note.name}
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>

//       <div class='mt-6 text-sm text-gray-600'>
//         <p>
//           Note: Ensure you have a c4.mp3 sample in your
//           public/audio/test-samples directory.
//         </p>
//       </div>
//     </div>
//   );
// }
