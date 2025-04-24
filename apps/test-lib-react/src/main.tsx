import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import './style.css';

import { audiolib } from '@repo/audiolib';
import SamplePlayer from './components/SamplePlayer';
import KarplusStrongSynthComponent from './components/KarplusStrongSynth';

const App = () => {
  const audiolibRef = useRef(audiolib);
  const [isInitialized, setInitialized] = useState(false);
  const [chosenInstrument, setChosenInstrument] = useState<string>('');

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

          {chosenInstrument === 'sampler' && <SamplePlayer />}
          {chosenInstrument === 'karplus' && <KarplusStrongSynthComponent />}
        </>
      ) : (
        <div>
          <button
            id='initAudiolib'
            onClick={async () => {
              await audiolibRef.current.init();
              setInitialized(true);
            }}
          >
            Initialize Audiolib!
          </button>
        </div>
      )}
    </div>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
