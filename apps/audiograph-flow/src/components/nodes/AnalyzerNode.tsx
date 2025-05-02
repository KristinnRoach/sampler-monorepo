import { useRef, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { audiolib } from '@repo/audiolib';

interface AnalyzerNodeData {
  registerMethods?: (methods: any) => void;
}

// Visualization options
const FFT_SIZE = 2048;
const SMOOTHING = 0.85;
const CANVAS_HEIGHT = 150;
const CANVAS_WIDTH = 280;

const AnalyzerNode = ({ data, isConnectable }: NodeProps<AnalyzerNodeData>) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const inputRef = useRef<GainNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [visualizationType, setVisualizationType] = useState<
    'waveform' | 'frequency'
  >('waveform');

  // Initialize the analyzer
  useEffect(() => {
    const initAnalyzer = async () => {
      try {
        await audiolib.init();
        const ctx = await audiolib.ensureAudioCtx();

        if (!ctx) {
          console.error('Failed to get audio context');
          return;
        }

        // Create analyzer node
        const analyzer = ctx.createAnalyser();
        analyzer.fftSize = FFT_SIZE;
        analyzer.smoothingTimeConstant = SMOOTHING;

        // Create input gain node
        const input = ctx.createGain();
        input.connect(analyzer);

        // Store refs
        analyzerRef.current = analyzer;
        inputRef.current = input;

        setIsInitialized(true);

        // Expose methods to parent component
        if (data.registerMethods) {
          data.registerMethods({
            getInput: () => input,
          });
        }

        // Start visualization
        startVisualization();
      } catch (error) {
        console.error('Error initializing analyzer:', error);
      }
    };

    initAnalyzer();

    // Cleanup on unmount
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (inputRef.current) {
        inputRef.current.disconnect();
      }
    };
  }, [data]);

  const startVisualization = () => {
    if (!canvasRef.current || !analyzerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyzer = analyzerRef.current;
    const bufferLength =
      visualizationType === 'waveform'
        ? analyzer.fftSize
        : analyzer.frequencyBinCount;

    const dataArray =
      visualizationType === 'waveform'
        ? new Float32Array(bufferLength)
        : new Uint8Array(bufferLength);

    const draw = () => {
      if (!ctx || !canvas || !analyzer) return;

      animationRef.current = requestAnimationFrame(draw);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (visualizationType === 'waveform') {
        if (!dataArray) return;
        if (!(dataArray instanceof Float32Array)) return;

        analyzer.getFloatTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#3498db';
        ctx.beginPath();

        const sliceWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray?.[i] ?? 0) * 0.5 + 0.5; // Convert -1:1 to 0:1
          const y = v * canvas.height;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      } else {
        if (dataArray instanceof Uint8Array) {
          analyzer.getByteFrequencyData(dataArray);
        }

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = ((dataArray?.[i] ?? 0) / 255) * canvas.height;

          // Create gradient color based on frequency
          const hue = (i / bufferLength) * 240; // Blue to red
          ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

          x += barWidth + 1;
          if (x > canvas.width) break;
        }
      }
    };

    draw();
  };

  const toggleVisualizationType = () => {
    // Cancel current animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    // Toggle visualization type
    setVisualizationType((prev) =>
      prev === 'waveform' ? 'frequency' : 'waveform'
    );

    // Restart visualization
    startVisualization();
  };

  return (
    <div
      className='analyzer-node'
      style={{
        padding: '10px',
        background: '#f0f0f0',
        borderRadius: '5px',
        width: '300px',
      }}
    >
      <Handle
        type='target'
        position={Position.Top}
        id='audio-in'
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />

      <div style={{ marginBottom: '8px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Audio Analyzer</h4>

        <div style={{ marginBottom: '8px' }}>
          <button
            onClick={toggleVisualizationType}
            className='nodrag'
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              marginBottom: '8px',
              cursor: 'pointer',
            }}
          >
            {visualizationType === 'waveform'
              ? 'Show Frequency'
              : 'Show Waveform'}
          </button>

          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className='nodrag'
            style={{
              backgroundColor: '#222',
              borderRadius: '3px',
              display: 'block',
            }}
          />
        </div>

        <div style={{ fontSize: '11px', marginTop: '5px' }}>
          <div>{isInitialized ? 'Analyzer Ready' : 'Initializing...'}</div>
          <div>
            Mode:{' '}
            {visualizationType === 'waveform' ? 'Oscilloscope' : 'Spectrum'}
          </div>
        </div>
      </div>

      <Handle
        type='source'
        position={Position.Bottom}
        id='audio-out'
        style={{ background: '#555' }}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default AnalyzerNode;
