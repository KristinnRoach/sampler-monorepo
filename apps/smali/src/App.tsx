import { Component, onMount, createSignal, createEffect } from 'solid-js';

import { SamplePlayer, createSamplePlayer } from '@repo/audiolib';

import type { KnobPresetKey } from '@repo/audio-components/solidjs';

import KnobGroup from './components/knobs/KnobGroup';

const App: Component = () => {
  const [activeInstruments, setActiveInstruments] = createSignal<
    Record<string, SamplePlayer>
  >({});

  const knobs: Array<KnobPresetKey> = [
    'volume',
    'feedback',
    'delaySend',
    'delayTime',
    'delayFeedback',
    'reverbSend',
    'reverbSize',
    'dryWet',
    'glide',
    'feedbackPitch',
    'feedbackDecay',
    'feedbackLpf',
    'gainLFORate',
    'gainLFODepth',
  ];

  onMount(async () => {
    const samplePlayer = await createSamplePlayer();
    const playerId = samplePlayer.nodeId;
    setActiveInstruments({ [playerId]: samplePlayer });

    if (!samplePlayer) return;

    // Minimal keyboard support for testing
    // Todo: samplePlayer.enableKeyboard('Major');
    document.addEventListener('keydown', (e) => {
      if (e.key === 'a') {
        samplePlayer?.play(60);
      } else if (e.key === 's') {
        samplePlayer?.play(62);
      } else if (e.key === 'd') {
        samplePlayer?.play(64);
      }
    });

    return () => {
      document.removeEventListener('keydown', () => {});
      samplePlayer?.dispose(); // todo: dispose for each instrument in activeInstruments
    };
  });

  createEffect(() => {
    const instruments = activeInstruments();
    console.info('Active instruments changed:', instruments);
  });

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Smali Sampler</h2>
      <p>Press 'a', 's', or 'd' keys to play notes</p>

      <KnobGroup
        title='KnobGroup'
        instruments={activeInstruments}
        knobPresets={knobs}
      />
    </div>
  );
};

export default App;
