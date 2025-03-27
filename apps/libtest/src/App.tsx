import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import SSPlayerTest from './components/SingleSamplePlayer/SSPlayerTest';
import { NoiseTest } from '@repo/audiolib';
import styles from './App.module.css';

type TestComponent = 'loop' | 'voice' | 'noise';

export async function loadFileAsString(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load processor: ${response.status}`);
  }
  return await response.text();
}

const App: Component = () => {
  const [activeTest, setActiveTest] = createSignal<TestComponent>('voice');

  const [noise, setNoise] = createSignal<NoiseTest | null>(null);

  const toggleNoise = () => {
    if (noise()) {
      noise()?.stop();
      setNoise(null);
    } else {
      const noiseTest = new NoiseTest();
      noiseTest.start();
      setNoise(noiseTest);
    }
  };

  const testLoadString = async () => {
    await loadFileAsString('./noise-processor.js');
  };

  console.log('testLoadString', () => testLoadString);

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

        <button onClick={() => toggleNoise()}>NOISE</button>
      </main>
    </div>
  );
};

export default App;
