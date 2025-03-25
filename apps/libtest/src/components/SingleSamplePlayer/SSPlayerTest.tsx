import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { createSingleSamplePlayer, loadAudioSample } from '@repo/audiolib';

// Define interface for the SingleSamplePlayer
interface SingleSamplePlayer {
  connect: (destination: AudioNode) => void;
  play: (midiNote: number, velocity: number) => void;
  stopAll: (releaseTime: number) => void;
  dispose: () => void;
  setVolume: (volume: number) => void;
  getActiveVoiceCount: () => number;
}

export default function TestSingleSamplePlayer() {
  const [player, setPlayer] = createSignal<SingleSamplePlayer | null>(null);
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [volume, setVolume] = createSignal(0.8);
  const [activeVoices, setActiveVoices] = createSignal(0);

  // Reference to track active voices
  let voiceCountInterval: number | undefined;

  onMount(async () => {
    try {
      // Load sample
      const samplePath = '/audio/test-samples/c4.mp3';
      const audioBuffer = await loadAudioSample(samplePath);

      // Create player
      const samplePlayer = (await createSingleSamplePlayer(
        'piano',
        audioBuffer,
        {
          polyphony: 8,
          rootNote: 60, // Middle C
        }
      )) as SingleSamplePlayer;

      // Connect to audio output
      samplePlayer.connect();

      // Update state
      setPlayer(samplePlayer);
      setIsLoaded(true);

      // Set up voice count monitoring
      voiceCountInterval = setInterval(() => {
        if (samplePlayer) {
          setActiveVoices(samplePlayer.getActiveVoiceCount());
        }
      }, 100);
    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
  });

  onCleanup(() => {
    // Clean up interval and player resources
    if (voiceCountInterval) {
      clearInterval(voiceCountInterval);
    }

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
      currentPlayer.play(midiNote, 1.0);
    }
  };

  const handleStopAll = () => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.stopAll(0.1);
    }
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
          <div>Active Voices: {activeVoices()}/8</div>
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
        </div>

        <button
          onClick={handleStopAll}
          disabled={!isLoaded()}
          class='px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50'
        >
          Stop All
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

      <div class='mt-6 text-sm text-gray-600'>
        <p>
          Note: Ensure you have a c4.mp3 sample in your
          public/audio/test-samples directory.
        </p>
      </div>
    </div>
  );
}
