// offlineAudioContext.ts

const offlineInstances = new Map<string, OfflineAudioContext>();

export type OfflineContextConfig = {
  length: number;
  numberOfChannels?: number;
  sampleRate?: number;
};

// remember to release!
export function getOfflineAudioContext(
  config: OfflineContextConfig
): OfflineAudioContext {
  if (!config.length || config.length <= 0) {
    throw new Error(
      'Length is required, e.g. buffer size (samples), or (duration (seconds) * sample rate)'
    );
  }

  const key = `${config.length}-${config.numberOfChannels || 2}-${config.sampleRate || 44100}`;

  if (!offlineInstances.has(key)) {
    const offlineContext = new OfflineAudioContext({
      length: config.length,
      numberOfChannels: config.numberOfChannels || 2,
      sampleRate: config.sampleRate || 44100,
    });

    console.log(`Offline audio context created (remember to release it).
          Current nr of offline ctx instances: ${offlineInstances.size} `);

    offlineInstances.set(key, offlineContext);
  }

  return offlineInstances.get(key)!;
}

export function releaseOfflineContext(config: OfflineContextConfig): boolean {
  const key = `${config.length}-${config.numberOfChannels || 2}-${config.sampleRate || 44100}`;
  console.log(
    `Offline audio context released. 
    Current nr of offline ctx instances: ${offlineInstances.size} `
  );
  return offlineInstances.delete(key);
}
