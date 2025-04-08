// globalAudioContext.ts

import { SystemEventBus } from '@/events';

let globalAudioContext: AudioContext | null = null;
let resumePromise: Promise<void> | null = null;

type AudioContextConfig = {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
};

// Non-async for use in constructors and synchronous code - Use ensureAudioCtx when possible
export function getAudioContext(config?: AudioContextConfig): AudioContext {
  if (!globalAudioContext) {
    console.log('Creating new AudioContext');
    globalAudioContext = new AudioContext({
      sampleRate: config?.sampleRate,
      latencyHint: config?.latencyHint || 'interactive',
    });

    SystemEventBus.notify('audiocontext:created', {
      publisherId: 'SingletonAudioContext',
      message: `outputlatency: ${globalAudioContext.outputLatency},\nbaselatency: ${globalAudioContext.baseLatency},\nsampleRate: ${globalAudioContext.sampleRate}\nctx: ${globalAudioContext}`,
    });

    // Set up auto-resume on first creation, but don't await it
    if (globalAudioContext.state === 'suspended') {
      resumePromise = resumePromise || setupAutoResume();
    }
  }

  // Always return the context immediately, even if suspended
  return globalAudioContext;
}

function setupAutoResume(): Promise<void> {
  const resumeEvents = ['click', 'touchstart', 'keydown'];

  return new Promise((resolve) => {
    const handler = async () => {
      if (globalAudioContext) {
        await globalAudioContext.resume();
        SystemEventBus.notify('audiocontext:resumed', {
          publisherId: 'SingletonAudioContext',
          message: `ctx: ${globalAudioContext}`,
        });
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

// Call this when async is allowed
export async function ensureAudioCtx(
  config?: AudioContextConfig
): Promise<AudioContext> {
  const context = getAudioContext(config);

  if (context.state === 'running') {
    return context;
  }

  // If resumePromise is null, set it up
  resumePromise = resumePromise || setupAutoResume();

  await resumePromise;

  return context;
}

/* todo: listen for ctx events
sinkchange Experimental, onstatechange
Fired when the output audio device (and therefore, the AudioContext.sinkId) has changed.
*/
