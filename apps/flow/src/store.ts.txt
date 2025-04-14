import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
// import { nanoid } from 'nanoid';
import { create } from 'zustand';
import {
  isRunning,
  toggleAudio,
  createAudioNode,
  updateAudioNode,
  removeAudioNode,
  connect,
  disconnect,
} from './audio';

export interface StoreState {
  tempId: number;
  nodes: Array<any>;
  edges: Array<any>;
  isRunning: boolean;
  toggleAudio: () => void;
  onNodesChange: (changes: any) => void;
  createNode: (type: string, x: number, y: number) => void;
  updateNode: (id: string, data: any) => void;
  onNodesDelete: (deleted: Array<{ id: string }>) => void;
  onEdgesChange: (changes: any) => void;
  addEdge: (data: any) => void;
  onEdgesDelete: (deleted: Array<{ source: string; target: string }>) => void;
  addOsc?: () => void;
  addAmp?: () => void;
}

export const useStore = create<StoreState>((set, get) => ({
  tempId: 0,
  nodes: [
    {
      id: 'osc',
      type: 'osc',
      data: { frequency: 220, type: 'square' },
      position: { x: 0, y: -100 },
    },
    {
      id: 'amp',
      type: 'amp',
      data: { gain: 0.5 },
      position: { x: -100, y: 100 },
    },
    { id: 'output', type: 'out', position: { x: 50, y: 250 } },
  ],
  edges: [
    { id: 'osc->amp', source: 'osc', target: 'amp' },
    { id: 'amp->output', source: 'amp', target: 'output' },
  ],
  isRunning: isRunning(),

  toggleAudio() {
    toggleAudio().then(() => {
      set({ isRunning: isRunning() });
    });
  },

  onNodesChange(changes: any) {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  createNode(type: string, x: number, y: number) {
    const id = 'type' + get().tempId++;

    switch (type) {
      case 'osc': {
        const data = { frequency: 440, type: 'sine' };
        const position = { x: 0, y: 0 };

        createAudioNode(id, type, data);
        set({ nodes: [...get().nodes, { id, type, data, position }] });

        break;
      }

      case 'amp': {
        const data = { gain: 0.5 };
        const position = { x: 0, y: 0 };

        createAudioNode(id, type, data);
        set({ nodes: [...get().nodes, { id, type, data, position }] });

        break;
      }
    }
  },

  updateNode(id, data) {
    updateAudioNode(id, data);
    set({
      nodes: get().nodes.map((node) =>
        node.id === id
          ? { ...node, data: Object.assign(node.data, data) }
          : node
      ),
    });
  },

  onNodesDelete(deleted) {
    for (const { id } of deleted) {
      removeAudioNode(id);
    }
  },

  onEdgesChange(changes) {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  addEdge(data) {
    const id =
      'Edge_' + get().tempId++ + 'from: ' + data.source + 'to: ' + data.target;
    const edge = { id, ...data };

    connect(edge.source, edge.target);
    set({ edges: [edge, ...get().edges] });
  },

  onEdgesDelete(deleted) {
    for (const { source, target } of deleted) {
      disconnect(source, target);
    }
  },
}));
