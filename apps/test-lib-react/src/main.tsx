// import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

// import { audiolib } from '@repo/audiolib';
import SourcePlayer from './components/SourcePlayer';

const App = () => {
  // const audiolibRef = useRef(audiolib);
  // const [isInitialized, setInitialized] = useState(false);

  return (
    <div>
      <SourcePlayer />
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
