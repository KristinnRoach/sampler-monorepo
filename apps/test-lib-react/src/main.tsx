import { createRoot } from 'react-dom/client';
import { useCallback, useState } from 'react';
import './style.css';

import { createAudiolib, Audiolib, getInstance } from '@repo/audiolib';

import SamplerComponent from './components/SamplerComponent';
import KarplusStrongSynthComponent from './components/KsSynthComponent';

const App = () => {
  const [audiolib, setAudiolib] = useState<Audiolib | null>(null);
  const [isInitialized, setInitialized] = useState(false);
  const [chosenInstrument, setChosenInstrument] = useState<string>('');

  const initializeAudio = useCallback(async () => {
    try {
      const lib = getInstance();
      await lib.init();
      console.table(lib);
      setAudiolib(lib);
      setInitialized(true);
    } catch (error) {
      console.error('Failed to initialize audiolib:', error);
    }
  }, []);

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
