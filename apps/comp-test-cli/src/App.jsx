// apps/test-app/src/App.jsx
import {
  AudioContextProvider,
  AudioBufferSourceNode,
  OscillatorNode,
  FilterNode,
  AudioOutput,
} from '@repo/audio-components';

export default function App() {
  return (
    <div className='p-4 max-w-3xl mx-auto'>
      <audio-context></audio-context>

      <h1 className='text-2xl font-bold mb-4'>Audio Components Test</h1>

      <div className='space-y-4 bg-gray-100 p-4 rounded-lg'>
        <div className='bg-white p-4 rounded'>
          <h2 className='font-bold mb-2'>Sample Player</h2>
          <audio-buffer-source id='sample1'></audio-buffer-source>
        </div>

        <div className='bg-white p-4 rounded'>
          <h2 className='font-bold mb-2'>Oscillator</h2>
          <audio-oscillator id='osc1'></audio-oscillator>
        </div>

        <div className='bg-white p-4 rounded'>
          <h2 className='font-bold mb-2'>Filter</h2>
          <audio-filter id='filter1'></audio-filter>
        </div>

        <div className='bg-white p-4 rounded'>
          <h2 className='font-bold mb-2'>Master Output</h2>
          <audio-output id='master'></audio-output>
        </div>
      </div>
    </div>
  );
}
