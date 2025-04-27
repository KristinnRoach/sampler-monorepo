// globalAudioContext.ts

import { DEFAULT } from '@/constants';

let globalAudioContext: AudioContext | null = null;
let resumePromise: Promise<void> | null = null;

export type AudioContextConfig = {
  sampleRate?: number;
  latencyHint?: AudioContextLatencyCategory;
};

// Non-async for use in constructors and synchronous code - Use ensureAudioCtx when possible
export function getAudioContext(config?: AudioContextConfig): AudioContext {
  if (!globalAudioContext) {
    globalAudioContext = new AudioContext({
      sampleRate: config?.sampleRate || DEFAULT.audio.sampleRate,
      latencyHint: config?.latencyHint || 'interactive',
    });

    // SystemEventBus.notify('audiocontext:created', {
    //   publisherId: 'GlobalAudioContext',
    //   message: `outputlatency: ${globalAudioContext.outputLatency},\nbaselatency: ${globalAudioContext.baseLatency},\nsampleRate: ${globalAudioContext.sampleRate}\nctx: ${globalAudioContext}`,
    // });

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
        // SystemEventBus.notify('audiocontext:resumed', {
        //   publisherId: 'GlobalAudioContext',
        //   message: `ctx: ${globalAudioContext}`,
        // });
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

export async function decodeAudioData(
  arrayBuffer: ArrayBuffer,
  config?: AudioContextConfig
): Promise<AudioBuffer | null> {
  const audioCtx = await ensureAudioCtx(config);
  return audioCtx.decodeAudioData(arrayBuffer);
}

export function releaseGlobalAudioContext(): void {
  if (globalAudioContext) {
    globalAudioContext.close().then(() => {
      // SystemEventBus.notify('audiocontext:closed', {
      //   publisherId: 'GlobalAudioContext',
      //   message: `ctx: ${globalAudioContext}`,
      // });
      globalAudioContext = null;
      resumePromise = null;
    });
  }
}

/* todo: listen for ctx events
sinkchange Experimental, onstatechange
Fired when the output audio device (and therefore, the AudioContext.sinkId) has changed.
*/
