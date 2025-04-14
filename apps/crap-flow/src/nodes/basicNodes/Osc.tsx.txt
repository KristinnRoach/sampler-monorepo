import { Handle, Position } from '@xyflow/react';
import { shallow } from 'zustand/shallow';
import { useStore } from '../../store';
import type { Node } from '@xyflow/react';

export interface TOsc extends Node {
  id: string;
  frequency: number;
  type: string;
  setFrequency: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setType: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export type OscNode = {
  id: string;
  type: 'osc';
  data: {
    label: string;
    frequency: number;
    type: string;
    setFrequency: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setType: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  };
  position: { x: number; y: number };
};

interface OscData {
  frequency?: number;
  type?: string;
}

interface OscProps {
  id: string;
  data: OscData;
}

interface OscStore {
  updateNode: (id: string, data: OscData) => void;
}

interface Selector {
  setFrequency: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setType: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const selector =
  (id: string) =>
  (store: OscStore): Selector => ({
    setFrequency: (e) => store.updateNode(id, { frequency: +e.target.value }),
    setType: (e) => store.updateNode(id, { type: e.target.value }),
  });

export default function Osc({ id, data }: OscProps) {
  const { setFrequency, setType } = useStore(selector(id), shallow);

  return (
    <div className={'rounded-md bg-white shadow-xl px-4 py-2'}>
      <p className={'rounded-md bg-white shadow-xl px-4 py-2'}>Osc</p>

      <label className={'flex flex-col px-2 pt-1 pb-4'}>
        <p className={'text-xs font-bold mb-2'}> Frequency</p>
        <input
          className='nodrag'
          type='range'
          min='10'
          max='1000'
          value={data.frequency}
          onChange={setFrequency}
        />
        <p className={'text-right text-xs'}>{data.frequency} Hz</p>
      </label>

      <hr className={'border-gray-200 mx-2'} />

      <label className={'flex flex-col px-2 pt-1 pb-4'}>
        <p className={'text-xs font-bold mb-2'}>Waveform</p>
        <select className='nodrag' value={data.type} onChange={setType}>
          <option value='sine'>sine</option>
          <option value='triangle'>triangle</option>
          <option value='sawtooth'>sawtooth</option>
          <option value='square'>square</option>
        </select>
      </label>

      <Handle className={'w-2 h-2'} type='source' position={Position.Bottom} />
    </div>
  );
}
