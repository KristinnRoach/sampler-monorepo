import { useState, useEffect, useRef } from 'react';
import { audiolib, Recorder } from '@repo/audiolib';

const RecorderComponent = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(
    null
  );
  const recorderRef = useRef<Recorder | null>(null);

  useEffect(() => {
    const initRecorder = async () => {
      const ctx = await audiolib.ensureAudioCtx();
      recorderRef.current = new Recorder(ctx);
      await recorderRef.current.init();

      // Connect to existing sampler if available
      const sampler = audiolib.getCurrentSampler();
      if (sampler) {
        recorderRef.current.connect(sampler);
      } else {
        console.warn('No sampler available to connect to');
      }
    };

    initRecorder().catch(console.error);

    return () => {
      recorderRef.current?.dispose();
    };
  }, []);

  const startRecording = async () => {
    if (!recorderRef.current) {
      console.error('Recorder not initialized');
      return;
    }

    try {
      setIsRecording(true);
      await recorderRef.current.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!recorderRef.current) {
      console.error('Recorder not initialized');
      return;
    }

    try {
      const buffer = await recorderRef.current.stop();
      setRecordingDuration(buffer.duration);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Recorder Test</h2>

      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!recorderRef.current}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {recordingDuration && (
        <p>Last recording duration: {recordingDuration.toFixed(2)}s</p>
      )}
    </div>
  );
};

export default RecorderComponent;
