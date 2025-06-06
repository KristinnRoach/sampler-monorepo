import { useState, useEffect, useRef } from 'react';
import {
  createAudioRecorder,
  type Recorder,
  type SamplePlayer,
  type SampleLoader,
  type LibNode,
  type Audiolib,
} from '@repo/audiolib';

interface RecorderComponentProps {
  destination?: (LibNode & SampleLoader) | SamplePlayer;
  audiolib?: Audiolib;
}

const RecorderComponent = ({
  destination,
  audiolib,
}: RecorderComponentProps) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<Recorder | null>(null);

  // Initialize recorder
  useEffect(() => {
    if (!destination) return;

    const initRecorder = async () => {
      try {
        // Use audiolib if provided, otherwise use the factory function
        recorderRef.current = await createAudioRecorder();
        if (recorderRef.current) {
          recorderRef.current.connect(destination);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize recorder:', error);
      }
    };

    initRecorder();

    return () => {
      if (recorderRef.current) {
        recorderRef.current.dispose();
        recorderRef.current = null;
      }
    };
  }, [destination, audiolib]);

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
      await recorderRef.current.stop();
    } catch (error) {
      console.error('Failed to stop recording:', error);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'green', padding: '20px' }}>
      {isInitialized && (
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!recorderRef.current}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
      )}
    </div>
  );
};

export default RecorderComponent;
