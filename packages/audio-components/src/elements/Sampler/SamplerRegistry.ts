// SamplerRegistry.ts
import { SamplePlayer } from '@repo/audiolib';

const samplerRegistry = new Map<string, SamplePlayer>();
const changeCallbacks = new Set<() => void>();

export const registerSampler = (nodeId: string, sampler: SamplePlayer) => {
  samplerRegistry.set(nodeId, sampler);
  // Notify all listeners
  changeCallbacks.forEach((callback) => callback());
};

export const unregisterSampler = (nodeId: string) => {
  samplerRegistry.delete(nodeId);
  changeCallbacks.forEach((callback) => callback());
};

export const getSampler = (nodeId: string): SamplePlayer | null => {
  return samplerRegistry.get(nodeId) || null;
};

export const onRegistryChange = (callback: () => void) => {
  changeCallbacks.add(callback);
  return () => changeCallbacks.delete(callback); // Return cleanup function
};

export const getAllSamplerIds = (): string[] => {
  return Array.from(samplerRegistry.keys());
};

export const hasSampler = (nodeId: string): boolean => {
  return samplerRegistry.has(nodeId);
};
