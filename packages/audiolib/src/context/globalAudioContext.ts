// globalAudioContext.ts

let globalAudioContext: AudioContext | null = null;
let resumePromise: Promise<void> | null = null;

type AudioContextConfig = {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
};

export async function getAudioContext(
  config?: AudioContextConfig
): Promise<AudioContext> {
  if (!globalAudioContext) {
    console.log('Creating new AudioContext');
    globalAudioContext = new AudioContext({
      sampleRate: config?.sampleRate,
      latencyHint: config?.latencyHint || 'interactive',
    });
  }

  if (globalAudioContext.state === 'suspended') {
    resumePromise = resumePromise || setupAutoResume();
    await resumePromise;
  }

  return globalAudioContext;
}

function setupAutoResume(): Promise<void> {
  const resumeEvents = ['click', 'touchstart', 'keydown'];

  return new Promise((resolve) => {
    const handler = async () => {
      if (globalAudioContext) {
        await globalAudioContext.resume();
        resumeEvents.forEach((event) =>
          document.removeEventListener(event, handler)
        );
        resolve();
      }
    };

    resumeEvents.forEach((event) =>
      document.addEventListener(event, handler, { once: true })
    );
  });
}
