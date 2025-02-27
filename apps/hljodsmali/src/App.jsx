import styles from './App.module.css';
import SampleRecorder from './recorder/SampleRecorder';
import SourceNodePlayer from './sourceNodePlayer/SourceNodePlayer';

export default function App() {
  return (
    <>
      <SampleRecorder />
      <SourceNodePlayer />
    </>
  );
}
