import type { Component } from 'solid-js';
import { createSignal, onMount } from 'solid-js';
import SSPlayerTest from './components/SingleSamplePlayer/SSPlayerTest';
// import { globalKeyboardInput } from '@repo/audiolib';
import { ensureAudioCtx, getAudioContext } from '@repo/audiolib'; // registry
import styles from './App.module.css';

const App: Component = () => {
  const [audioCtx, setAudioCtx] = createSignal<AudioContext | null>(null);
  const [audioReady, setAudioReady] = createSignal(false);

  onMount(() => {
    const ctx = getAudioContext();
    ensureAudioCtx()
      .then(() => {
        setAudioCtx(ctx);
        setAudioReady(true);
        console.log(`Is audio ready?, ${audioReady()} , ctx: ${audioCtx()}`);
      })
      .catch((error: any) => {
        console.trace(`Error ensuring audio context: ${error}`);
      });
  });

  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <h1>AudioLib Testing App</h1>
      </header>
      <main class={styles.main}>
        {!audioReady() && (
          <div>
            <h2>Click anywhere to start</h2>
          </div>
        )}

        {audioReady() && (
          <div>
            <SSPlayerTest />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
