import { useState, useRef, useEffect } from 'react';
import KeyboardController from '../input/KeyboardController';
import { audiolib, KarplusStrongSynth } from '@repo/audiolib';

const KarplusStrongSynthComponent = () => {
  const [initialized, setInitialized] = useState(false);
  const [activeVoices, setActiveVoices] = useState(0);
  const [volume, setVolume] = useState(1);
  const synthRef = useRef<KarplusStrongSynth | null>(null);

  // Parameter states
  const [decay, setDecay] = useState(0.9);
  const [noiseTime, setNoiseTime] = useState(10);

  const createSynth = () => {
    if (initialized) return;

    if (synthRef.current) {
      synthRef.current.dispose();
    }
    const synth = audiolib.createKarplusStrongSynth(16);
    synthRef.current = synth;
    setInitialized(true);
  };

  const handleDecayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setDecay(value);
    if (synthRef.current) {
      synthRef.current.setParamValue('decay', value);
    }
  };

  const handleNoiseTimeChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = parseFloat(event.target.value);
    setNoiseTime(value);
    if (synthRef.current) {
      synthRef.current.setParamValue('noiseTime', value);
    }
  };

  const handleNoteOn = (midiNote: number, velocity?: number) => {
    if (synthRef.current) {
      synthRef.current.playNote(midiNote, velocity);
      setActiveVoices((prev) => prev + 1);
    }
  };

  const handleNoteOff = (midiNote: number) => {
    if (synthRef.current) {
      synthRef.current.stopNote(midiNote);
      setActiveVoices((prev) => Math.max(prev - 1, 0));
    }
  };

  useEffect(() => {
    createSynth();
    // return () => {
    //   if (synthRef.current) {
    //     synthRef.current.dispose();
    //     synthRef.current = null;
    //   }
    // };
  }, []);

  useEffect(() => {
    if (synthRef.current) {
      synthRef.current.volume = volume;
    }
  }, [volume]);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Karplus-Strong Synth</h1>

      {initialized && (
        <div>
          <div style={{ margin: '20px 0' }}>
            <div>Active Voices: {activeVoices}</div>

            <div style={{ margin: '20px 0' }}>
              <label>
                Volume:
                <input
                  type='range'
                  min='0'
                  max='1'
                  step='0.01'
                  value={volume}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    setVolume(value);
                    if (synthRef.current) {
                      synthRef.current.setParamValue('volume', value);
                    }
                  }}
                />
                <span>{volume.toFixed(2)}</span>
              </label>
            </div>

            <div style={{ margin: '20px 0' }}>
              <label>
                Decay:
                <input
                  type='range'
                  min='0.8'
                  max='0.999'
                  step='0.001'
                  value={decay}
                  onChange={handleDecayChange}
                />
                <span>{decay.toFixed(3)}</span>
              </label>
            </div>

            <div style={{ margin: '20px 0' }}>
              <label>
                Noise Time (ms):
                <input
                  type='range'
                  min='1'
                  max='50'
                  step='1'
                  value={noiseTime}
                  onChange={handleNoiseTimeChange}
                />
                <span>{noiseTime}ms</span>
              </label>
            </div>
          </div>

          <KeyboardController
            onNoteOn={handleNoteOn}
            onNoteOff={handleNoteOff}
          />
        </div>
      )}
    </div>
  );
};

export default KarplusStrongSynthComponent;
