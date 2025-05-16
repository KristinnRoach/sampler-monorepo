import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import './style.css';

import { audiolib } from '@repo/audiolib';
import SamplerComponent from './components/SamplerComponent';
// import SamplerInstrumentComponent from './components/SampleInstrumentComponent';
// import KarplusStrongSynthComponent from './components/KsSynthComponent';

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
            {/* <button onClick={() => setChosenInstrument('instrument')}>
              Instrument
            </button>
            <button onClick={() => setChosenInstrument('karplus')}>
              Karplus
            </button> */}
          </div>

          {/* Show Recorder alongside Sampler */}
          {chosenInstrument === 'sampler' && <SamplerComponent />}
          {/* {chosenInstrument === 'instrument' && <SamplerInstrumentComponent />}
          {chosenInstrument === 'karplus' && <KarplusStrongSynthComponent />} */}
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
