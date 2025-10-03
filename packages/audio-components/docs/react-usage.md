```typescript

// Example usage of React KnobComponent
import React, { useState } from 'react';
import {
  KnobComponent,
  KnobChangeEventDetail,
} from '@repo/audio-components/react';
import '@repo/audio-components/style';

function App() {
  const [value, setValue] = useState(0.5);
  const [volume, setVolume] = useState(0.75);

  const handleChange = (detail: KnobChangeEventDetail) => {
    setValue(detail.value);
    console.log('Knob changed:', detail);
  };

  const handleVolumeChange = (detail: KnobChangeEventDetail) => {
    setVolume(detail.value);
  };

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* Basic knob */}
      <KnobComponent
        value={value}
        onChange={handleChange}
        label='Basic Knob'
        size={60}
      />

      {/* Knob with preset */}
      <KnobComponent
        preset='volume'
        value={volume}
        onChange={handleVolumeChange}
        size={80}
      />

      {/* Custom styled knob */}
      <KnobComponent
        label='Custom'
        value={0.3}
        minValue={0}
        maxValue={1}
        defaultValue={0.3}
        size={50}
        color='#ff6b6b'
        displayValue={true}
        valueFormatter={(v) => `${Math.round(v * 100)}%`}
        className='custom-knob-container'
        labelStyle={{ color: '#333', fontWeight: 'bold' }}
        valueStyle={{ color: '#666' }}
      />

      {/* Knob with snapping */}
      <KnobComponent
        label='Stepped'
        defaultValue={0}
        minValue={0}
        maxValue={10}
        snapIncrement={1}
        displayValue={true}
        valueFormatter={(v) => v.toString()}
      />
    </div>
  );
}

export default App;

```
