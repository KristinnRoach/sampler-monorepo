import { createRoot } from 'react-dom/client';
import { useState, useEffect } from 'react';
import './style.css';

import {
  createAudiolib,
  type SamplePlayer,
  type KarplusStrongSynth,
  Audiolib,
} from '@repo/audiolib';

import SamplerComponent from './components/SamplerComponent';
import KarplusStrongSynthComponent from './components/KsSynthComponent';

const App = () => {
  const [audiolib, setAudiolib] = useState<Audiolib | null>(null);
  const [isInitialized, setInitialized] = useState(false);
  const [chosenInstrument, setChosenInstrument] = useState<string>('');

  const initializeAudio = async () => {
    const lib = await createAudiolib();
    setAudiolib(lib);
    setInitialized(true);
  };

  return (
    <div>
      {isInitialized ? (
        <>
          <div>
            <button onClick={() => setChosenInstrument('sampler')}>
              Sampler
            </button>
            <button onClick={() => setChosenInstrument('karplus')}>
              Karplus
            </button>
          </div>

          {chosenInstrument === 'sampler' && (
            <SamplerComponent context={audiolib} />
          )}
          {chosenInstrument === 'karplus' && (
            <KarplusStrongSynthComponent audiolib={audiolib} />
          )}
        </>
      ) : (
        <div>
          <button id='initAudiolib' onClick={initializeAudio}>
            Initialize Audiolib!
          </button>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
