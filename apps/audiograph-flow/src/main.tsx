import { createRoot } from 'react-dom/client';
import { useRef, useState } from 'react';
import './styles.css';
import { audiolib } from '@repo/audiolib';

import Canvas from './components/Canvas';
import SamplerFlowExample from './components/nodes/SamplerFlow.js';

const App = () => {
  const audiolibRef = useRef(audiolib);
  const [isInitialized, setInitialized] = useState(false);

  return (
    <div>
      {isInitialized ? (
        <>
          <div>
            <Canvas />
            <SamplerFlowExample />
          </div>
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
