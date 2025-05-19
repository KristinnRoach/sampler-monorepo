import { useState, useEffect, useRef } from 'react';
import {
  audiolib,
  Recorder,
  type SamplePlayer,
  type SampleLoader,
  type LibNode,
} from '@repo/audiolib';

interface RecorderComponentProps {
  destination?: (LibNode & SampleLoader) | SamplePlayer;
}

const RecorderComponent = ({ destination }: RecorderComponentProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(
    null
  );
  const recorderRef = useRef<Recorder | null>(null);

  useEffect(() => {
    const initRecorder = async () => {
      // if (!audiolib.isInitialized) await audiolib.init(); // ensure idempotent

      try {
        recorderRef.current = await audiolib.createRecorder(destination);

        // Listeners
        recorderRef.current.onMessage('record:start', () => {
          setIsRecording(true);
        });

        recorderRef.current.onMessage('record:stop', (message) => {
          setRecordingDuration(message.data?.duration ?? 0);
          setIsRecording(false);
        });

        console.log('Recorder initialized ->', recorderRef.current.isReady);
        setIsInitialized(recorderRef.current.isReady);
      } catch (error) {
        console.error('Failed to create recorder:', error);
      }
    };

    initRecorder().catch(console.error);

    return () => {
      if (recorderRef.current) {
        recorderRef.current.dispose();
        recorderRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [destination]); // Re-run when destination changes

  const startRecording = async () => {
    if (!recorderRef.current?.isReady) {
      console.error('Recorder not initialized');
      setIsInitialized(false);
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
      {isInitialized && (
        <>
          <h2>Recorder Test</h2>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={!recorderRef.current}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </>
      )}

      {recordingDuration && (
        <p>Last recording duration: {recordingDuration.toFixed(2)}s</p>
      )}
    </div>
  );
};

export default RecorderComponent;
