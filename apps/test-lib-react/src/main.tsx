// import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

// import { audiolib } from '@repo/audiolib';
import SamplePlayer from './components/SamplePlayer';

const App = () => {
  // const audiolibRef = useRef(audiolib);
  // const [isInitialized, setInitialized] = useState(false);

  return (
    <div>
      <SamplePlayer />
      {/* <button
        id='initAudiolib'
        onClick={async () => {
          await audiolibRef.current.init();
          setInitialized(true);
        }}
      >
        Initialize Audiolib!
      </button> */}
    </div>
  );
};

createRoot(document.getElementById('app')!).render(<App />);
