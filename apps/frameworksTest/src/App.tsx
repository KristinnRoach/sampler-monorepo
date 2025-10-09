import { useState } from 'react';
import {
  KnobComponent,
  KnobChangeEventDetail,
  OscilloscopeComponent,
} from '@repo/audio-components/react';
import '@repo/audio-components/style';
import './App.css';

const customFormatter = (v: number) => `${Math.round(v * 100)}%`;
const customLabelStyle = {
  color: '#333',
  fontWeight: 'bold',
  fontSize: '14px',
};
const customValueStyle = {
  color: '#000000ff',
  fontSize: '12px',
  fontFamily: 'monospace',
};

function App() {
  const [basicValue, setBasicValue] = useState(0.5);
  const [volumeValue, setVolumeValue] = useState(0.75);
  const [feedbackValue, setFeedbackValue] = useState(0.2);
  const [customValue, setCustomValue] = useState(0.3);
  const [steppedValue, setSteppedValue] = useState(5);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [oscillator, setOscillator] = useState<OscillatorNode | null>(null);

  const startAudio = () => {
    if (audioContext) return; // Already started

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    osc.frequency.value = 440;
    osc.start();
    setAudioContext(ctx);
    setOscillator(osc);
  };

  const handleBasicChange = (detail: KnobChangeEventDetail) => {
    setBasicValue(detail.value);
  };

  const handleVolumeChange = (detail: KnobChangeEventDetail) => {
    setVolumeValue(detail.value);
  };

  const handleFeedbackChange = (detail: KnobChangeEventDetail) => {
    setFeedbackValue(detail.value);
  };

  const handleCustomChange = (detail: KnobChangeEventDetail) => {
    setCustomValue(detail.value);
  };

  const handleSteppedChange = (detail: KnobChangeEventDetail) => {
    setSteppedValue(detail.value);
  };

  return (
    <div className='app'>
      <header className='app-header'>
        <h1>React Audio Components Test</h1>
        <p>Testing KnobComponent wrapper</p>
      </header>

      <main className='knob-grid'>
        <div className='knob-section'>
          <h2>Basic Knob</h2>
          <KnobComponent
            value={basicValue}
            onChange={handleBasicChange}
            label='Basic'
            size={60}
            displayValue={true}
          />
          <p>Value: {basicValue.toFixed(3)}</p>
        </div>

        <div className='knob-section'>
          <h2>Volume Preset</h2>
          <KnobComponent
            preset='volume'
            value={volumeValue}
            onChange={handleVolumeChange}
            size={80}
          />
          <p>Value: {volumeValue.toFixed(3)}</p>
        </div>

        <div className='knob-section'>
          <h2>Feedback Preset</h2>
          <KnobComponent
            preset='feedback'
            value={feedbackValue}
            onChange={handleFeedbackChange}
            size={70}
          />
          <p>Value: {feedbackValue.toFixed(3)}</p>
        </div>

        <div className='knob-section'>
          <h2>Custom Style</h2>
          <KnobComponent
            label='Custom'
            value={customValue}
            onChange={handleCustomChange}
            minValue={0}
            maxValue={1}
            size={65}
            color='#000000ff'
            displayValue={true}
            valueFormatter={customFormatter}
            className='custom-knob'
            labelStyle={customLabelStyle}
            valueStyle={customValueStyle}
          />
          <p>Value: {customValue.toFixed(3)}</p>
        </div>

        <div className='knob-section'>
          <h2>Stepped Values</h2>
          <KnobComponent
            label='Steps'
            value={steppedValue}
            onChange={handleSteppedChange}
            minValue={0}
            maxValue={10}
            snapIncrement={1}
            displayValue={true}
            valueFormatter={(v) => v.toString()}
            size={60}
            color='#4CAF50'
          />
          <p>Value: {steppedValue}</p>
        </div>

        <div className='knob-section'>
          <h2>Oscilloscope</h2>
          {!audioContext && <button onClick={startAudio}>Start Audio</button>}
          {audioContext && (
            <OscilloscopeComponent
              audioContext={audioContext || undefined}
              inputNode={oscillator || undefined}
            />
          )}
        </div>
        {/*  TODO: Implement Pan Control Knob
        <div className='knob-section'>
          <h2>Pan Control</h2>
          <KnobComponent
            preset='pan'
            size={75}
            displayValue={true}
            valueFormatter={(v) => {
              if (v < -0.01) return `L${Math.abs(v * 100).toFixed(0)}`;
              if (v > 0.01) return `R${(v * 100).toFixed(0)}`;
              return 'C';
            }}
          />
        </div> */}
      </main>

      <footer className='app-footer'>
        <p>Open browser console to see change events</p>
      </footer>
    </div>
  );
}

export default App;
