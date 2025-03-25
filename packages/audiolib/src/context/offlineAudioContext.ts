// offlineAudioContext.ts
const offlineInstances = new Map<string, OfflineAudioContext>();

type OfflineContextConfig = {
  length: number;
  numberOfChannels?: number;
  sampleRate?: number;
};

export function getOfflineAudioContext(
  config: OfflineContextConfig
): OfflineAudioContext {
  if (!config.length) {
    throw new Error('Length is required for offline audio context');
  }

  const key = `${config.length}-${config.numberOfChannels || 2}-${config.sampleRate || 44100}`;

  if (!offlineInstances.has(key)) {
    const offlineContext = new OfflineAudioContext({
      length: config.length,
      numberOfChannels: config.numberOfChannels || 2,
      sampleRate: config.sampleRate || 44100,
    });

    offlineInstances.set(key, offlineContext);
  }

  return offlineInstances.get(key)!;
}

export function releaseOfflineContext(config: OfflineContextConfig): boolean {
  const key = `${config.length}-${config.numberOfChannels || 2}-${config.sampleRate || 44100}`;
  return offlineInstances.delete(key);
}
