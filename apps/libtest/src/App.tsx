import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';
import SSPlayerTest from './components/SingleSamplePlayer/SSPlayerTest';
// import { RandomNoiseWorklet, getAudioContext } from '@repo/audiolib';
import styles from './App.module.css';

type TestComponent = 'loop' | 'voice' | 'noise';

const App: Component = () => {
  const [activeTest, setActiveTest] = createSignal<TestComponent>('voice');
  // const [audioContext, setAudioContext] = createSignal<AudioContext | null>(
  //   null
  // );

  // onMount(async () => {
  //   const ctx = await getAudioContext();
  //   setAudioContext(ctx);
  //   if (!ctx) {
  //     console.error('Audio context is not initialized');
  //     return;
  //   }
  //   console.log('ctx.state', ctx.state);
  // });

  // const [noise, setNoise] = createSignal<RandomNoiseWorklet | null>(null);

  // const toggleNoise = () => {
  //   const ctx = audioContext();
  //   if (!ctx) {
  //     console.error('Audio context is not initialized');
  //     return;
  //   }
  //   console.log('ctx.state', ctx.state);
  //   if (ctx.state === 'suspended') {
  //     ctx.resume();
  //   }

  //   if (noise()) {
  //     noise()?.stop();
  //     setNoise(null);
  //   } else {
  //     const noise = new RandomNoiseWorklet();
  //     noise.start();
  //     setNoise(noise);
  //   }
  // };

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>AudioLib Testing App</h1>
        <div class={styles.tabs}>
          <button
            class={activeTest() === 'loop' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTest('loop')}
          >
            Loop Worklet Test
          </button>
          <button
            class={activeTest() === 'voice' ? styles.activeTab : styles.tab}
            onClick={() => setActiveTest('voice')}
          >
            Voice Node Test
          </button>
        </div>
      </header>
      <main class={styles.main}>
        {/* {activeTest() === 'loop' ? <LoopWorkletTest /> : <VoiceNodeTest />} */}
        <SSPlayerTest />

        {/* <button onClick={() => toggleNoise()}>NOISE</button> */}
      </main>
    </div>
  );
};

export default App;
