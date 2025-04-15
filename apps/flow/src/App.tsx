import SourceTestComponent from './nodes/SourceNodeTester/SourceTestComponent';
// import { useEffect } from 'react';
import './index.css';

// import { audiolib } from '@repo/audiolib';

export default function App() {
  // useEffect(() => {
  //   console.debug('App.tsx: Mounted');
  //   try {
  //     audiolib.init().then(() => console.debug('Audiolib initialized'));
  //   } catch (error) {
  //     console.error('Error initializing Audiolib:', error);
  //   }
  // }, []);

  return (
    <>
      <SourceTestComponent />
    </>
  );
}
