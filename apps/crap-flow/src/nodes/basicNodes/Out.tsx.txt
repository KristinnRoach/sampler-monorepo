import { Handle, Position } from '@xyflow/react';
import { shallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { Node } from '@xyflow/react';

export interface TOut extends Node {
  id: string;
  gain: number;
  toggleAudio: () => void;
}

export type OutNode = {
  id: string;
  type: 'out';
  data: {
    label: string;
    gain: number;
    toggleAudio: () => void;
  };
  position: { x: number; y: number };
};

interface StoreState {
  isRunning: boolean;
  toggleAudio: () => void;
}

interface OutData {
  gain: number;
}

const selector = (store: StoreState) => ({
  isRunning: store.isRunning,
  toggleAudio: store.toggleAudio,
});

export default function Out({}: { id: string; data: OutData }) {
  const { isRunning, toggleAudio } = useStore(selector, shallow);

  return (
    <div className={'rounded-md bg-white shadow-xl px-4 py-2'}>
      <Handle className={'w-2 h-2'} type='target' position={Position.Top} />

      <button onClick={toggleAudio}>
        {isRunning ? (
          <span role='img' aria-label='mute'>
            🔈
          </span>
        ) : (
          <span role='img' aria-label='unmute'>
            🔇
          </span>
        )}
      </button>
    </div>
  );
}
