import { createSignal, createEffect, onMount, onCleanup } from 'solid-js';
import { SingleSamplePlayer, SingleSamplePlayerProps } from '@repo/audiolib';
// import { audioBaseUrl, defaultSampleUrl } from '../../utils';

export default function TestSingleSamplePlayer() {
  const [player, setPlayer] = createSignal<SingleSamplePlayer | null>(null);
  const [polyphony, setPolyphony] = createSignal(16);
  const [sampleDuration, setSampleDuration] = createSignal(0);

  const [volume, setVolume] = createSignal(0.8);
  const [loopEnabled, setLoopEnabled] = createSignal(false);
  const [loopStart, setLoopStart] = createSignal(0);
  const [loopEnd, setLoopEnd] = createSignal(0);
  const [rampDuration, setRampDuration] = createSignal(0);

  const [isPlaying, setIsPlaying] = createSignal(false);
  const [isLoaded, setIsLoaded] = createSignal(false);

  const [lastEvent, setLastEvent] = createSignal('No events yet');

  // Event handlers

  const handleSetLoopStart = (value: number) => {
    if (value >= loopEnd()) return;

    const currentPlayer = player();
    const rampTime = rampDuration();

    if (currentPlayer) {
      currentPlayer.setLoopPoint('loopStart', value, rampTime);
      setLoopStart(value);
    }
  };

  const handleSetLoopEnd = (value: number) => {
    if (value <= loopStart()) return;

    const currentPlayer = player();
    const rampTime = rampDuration();

    if (currentPlayer) {
      currentPlayer.setLoopPoint('loopEnd', value, rampTime);
      setLoopEnd(value);
    }
  };

  const handleEnableLoop = () => {
    player()?.setLoopEnabled(true);
    setLoopEnabled(true);
  };

  const handleDisableLoop = () => {
    player()?.setLoopEnabled(false);
    setLoopEnabled(false);
  };

  const handleNoteOnData = (data: any) => {
    const { publisherId, note } = data;
    setLastEvent(`Voice ${publisherId} started - Note: ${note}`);
  };

  const handleNoteOffData = (data: any) => {
    const { publisherId, isAvailable } = data;

    setLastEvent(`Voice ${publisherId} ended, is available: ${isAvailable}`);
  };

  const handleErrorData = (data: any) => {
    const { publisherId, message } = data;
    setLastEvent(`Error in voice ${publisherId}: ${message}`);
  };

  onMount(async () => {
    try {
      if (player()) {
        console.log('Player already initialized');
        return;
      }
      const props: SingleSamplePlayerProps = {
        name: 'piano',
        polyphony: polyphony(),
        rootNote: 60,
        enableUserInput: 'computer-keyboard',
      };

      console.log('Initializing player...');
      const samplePlayer = new SingleSamplePlayer(props);
      console.trace(`Player created: ${samplePlayer}`);

      setPlayer(samplePlayer);
    } catch (error) {
      console.error('Failed to initialize player:', error);
    }
  });

  // Set up event listeners when player has been set
  createEffect(() => {
    const sp = player();
    if (!!sp) {
      sp.addListener('note:started', handleNoteOnData);
      sp.addListener('note:released', handleNoteOnData);
      sp.addListener('note:ended', handleNoteOffData);
      sp.addListener('error', handleErrorData);

      setSampleDuration(sp.getSampleDuration() ?? 0);
      setIsLoaded(true);
      // console.warn(`init?: ${samplePlayer.isInitialized()}`); // Why not ??
    }
  });

  onCleanup(() => {
    if (!player()) return;
    player()?.removeListener('note:started', handleNoteOnData);
    player()?.removeListener('note:released', handleNoteOnData);
    player()?.removeListener('note:ended', handleNoteOffData);
    player()?.removeListener('error', handleErrorData);
    player()?.dispose();
    setPlayer(null);
  });

  createEffect(() => {
    player()?.setVolume(volume());
  });

  const handleClickPlay = (midiNote: number) => {
    const currentPlayer = player();
    if (currentPlayer) {
      currentPlayer.playNote(midiNote, 1.0);
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

  // Piano keyboard for mouse input
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
          Status: {isLoaded() ? 'Ready' : 'Loading...'}
        </div>

        <div class='flex justify-between text-sm mb-1'>
          {isPlaying() ? 'Playing' : 'Stopped'}
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
            //max={sampleDuration()}
            max='1'
            step='0.05'
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
            min='0'
            // max={sampleDuration()}
            max='1'
            step='0.05'
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
            max='1'
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
            <span class='relative flex-1'>
              <button
                onClick={() => handleClickPlay(note.midi)}
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
            </span>
          ))}
        </div>
      </div>

      <div class='mt-6 text-sm text-gray-600'>{lastEvent().toString()}</div>
    </div>
  );
}
