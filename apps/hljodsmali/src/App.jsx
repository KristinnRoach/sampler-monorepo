import styles from './App.module.css';
import SampleRecorder from './recorder/SampleRecorder';
import TestSourceNode from './sourceNodePlayer/TestSourceNode';

export default function App() {
  return (
    <>
      <SampleRecorder />
      <TestSourceNode />
    </>
  );
}
