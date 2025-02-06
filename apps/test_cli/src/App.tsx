import { createSignal, createEffect, onCleanup, onMount } from 'solid-js';
import { createStore } from 'solid-js/store';
import { Instrument } from '@kid/audiolib';

// Map computer keys to MIDI note numbers
const keyToNote: Record<string, number> = {
  a: 60, // Middle C
  w: 61,
  s: 62,
  e: 63,
  d: 64,
  f: 65,
  t: 66,
  g: 67,
  y: 68,
  h: 69,
  u: 70,
  j: 71,
  k: 72, // One octave up
};

export default function App() {
  const [instrument] = createSignal(new Instrument());
  const [state, setState] = createStore({
    isPlaying: new Map(),
    parameters: {
      loopStart: 0,
      loopEnd: 1,
      loopEnabled: false,
    },
  });

  const handleFile = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    await instrument().loadSample(buffer);
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    const note = keyToNote[event.key];
    if (note && !event.repeat) {
      instrument().triggerNote(note, 1);
    }
  };

  const handleKeyUp = (event: KeyboardEvent) => {
    const note = keyToNote[event.key];
    if (note) {
      instrument().releaseNote(note);
    }
  };

  const setLoopPoint = (type: 'loopStart' | 'loopEnd', value: number) => {
    instrument().setParameter(type, value);
  };

  const toggleLoop = (enabled: boolean) => {
    instrument().setParameter('loopEnabled', enabled);
  };

  onMount(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const unsubscribe = instrument().onStateChange((newState) => {
      setState(newState);
    });

    onCleanup(() => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      unsubscribe();
    });
  });

  return (
    <div class='p-4'>
      <div class='mb-4'>
        <input
          type='file'
          accept='audio/*'
          onChange={handleFile}
          class='mb-4 block'
        />
      </div>

      <div class='mb-4'>
        <label class='block mb-2'>
          <input
            type='checkbox'
            checked={state.parameters.loopEnabled}
            onChange={(e) => toggleLoop(e.target.checked)}
          />
          {' Loop Enabled'}
        </label>

        <div class='grid gap-4'>
          <label class='block'>
            Loop Start:
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={state.parameters.loopStart}
              onChange={(e) => setLoopPoint('loopStart', +e.target.value)}
              class='block w-full'
            />
            {state.parameters.loopStart.toFixed(2)}s
          </label>

          <label class='block'>
            Loop End:
            <input
              type='range'
              min='0'
              max='1'
              step='0.01'
              value={state.parameters.loopEnd}
              onChange={(e) => setLoopPoint('loopEnd', +e.target.value)}
              class='block w-full'
            />
            {state.parameters.loopEnd.toFixed(2)}s
          </label>
        </div>
      </div>

      <div class='text-sm text-gray-600'>
        Use keys A,W,S,E,D,F,T,G,Y,H,U,J,K to play notes
      </div>
    </div>
  );
}
