import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { shallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { Node } from '@xyflow/react';

export interface TAmp extends Node {
  id: string;
  gain: number;
  setGain: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export type AmpNode = {
  id: string;
  type: 'amp';
  data: {
    label: string;
    gain: number;
    setGain: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  position: { x: number; y: number };
};

interface Store {
  updateNode: (id: string, data: { gain: number }) => void;
}

interface Selector {
  setGain: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const selector =
  (id: string) =>
  (store: Store): Selector => ({
    setGain: (e: React.ChangeEvent<HTMLInputElement>) =>
      store.updateNode(id, { gain: +e.target.value }),
  });

interface OscData {
  gain: number;
}

export default function Osc({ id, data }: { id: string; data: OscData }) {
  const { setGain } = useStore(selector(id), shallow);

  return (
    <div className={'rounded-md bg-white shadow-xl'}>
      <Handle className={'w-2 h-2'} type='target' position={Position.Top} />

      <p className={'rounded-t-md px-2 py-1 bg-blue-500 text-white text-sm'}>
        Amp
      </p>
      <label className={'flex flex-col px-2 pt-1 pb-4'}>
        <p className={'text-xs font-bold mb-2'}>Gain</p>
        <input
          className='nodrag'
          type='range'
          min='0'
          max='1'
          step='0.01'
          value={data.gain}
          onChange={setGain}
        />
        <p className={'text-right text-xs'}>{data.gain.toFixed(2)}</p>
      </label>

      <Handle className={'w-2 h-2'} type='source' position={Position.Bottom} />
    </div>
  );
}
