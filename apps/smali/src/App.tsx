import { Component, onMount, createSignal } from 'solid-js';
import {
  KnobComponent,
  type KnobChangeEventDetail,
  type KnobComponentProps,
} from '@repo/audio-components/solidjs';
import { SamplePlayer, createSamplePlayer } from '@repo/audiolib';

const knobProps: KnobComponentProps = {
  label: 'Volume',
  width: 50,
  minValue: 0,
  maxValue: 1,
  defaultValue: 0.75,
  snapIncrement: 0.01,
  curve: 1,
};

const App: Component = () => {
  let samplePlayer: SamplePlayer | null = null;

  onMount(async () => {
    if (!samplePlayer) {
      samplePlayer = await createSamplePlayer();
    }

    if (!samplePlayer) return;

    // Minimal keyboard support for testing
    document.addEventListener('keydown', (e) => {
      if (e.key === 'a') {
        samplePlayer?.play(60);
      } else if (e.key === 's') {
        samplePlayer?.play(62);
      } else if (e.key === 'd') {
        samplePlayer?.play(64);
      }
    });

    // Todo: samplePlayer.enableKeyboard('Major');

    return () => {
      document.removeEventListener('keydown', () => {});
      samplePlayer?.dispose();
      samplePlayer = null;
    };
  });

  return (
    <div>
      <KnobComponent
        // {...knobProps}
        label='Volume'
        width={50}
        minValue={0}
        maxValue={1}
        defaultValue={0.75}
        snapIncrement={0.01}
        curve={1}
        onChange={(detail: KnobChangeEventDetail) => {
          if (samplePlayer) samplePlayer.volume = detail.value;
        }}
      />
    </div>
  );
};

export default App;
