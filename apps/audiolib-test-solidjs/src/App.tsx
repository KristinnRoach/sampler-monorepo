import type { Component } from 'solid-js';
import { createSignal } from 'solid-js';
import LoopWorkletTest from './components/LoopWorklet/LoopWorkletTest';
// import VoiceNodeTest from './components/VoiceNodeTest/VoiceNodeTest';
import styles from './App.module.css';

type TestComponent = 'loop' | 'voice';

const App: Component = () => {
  const [activeTest, setActiveTest] = createSignal<TestComponent>('voice');

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
        <LoopWorkletTest />
      </main>
    </div>
  );
};

export default App;
