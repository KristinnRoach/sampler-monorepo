```typescript
// SamplePlayer.ts - Refactored with Standardized Async Init Pattern

import { LibNode, NodeType } from '@/nodes/LibNode';
import { ILibInstrumentNode } from '@/nodes/LibAudioNode';
import { registerNode, unregisterNode, NodeID } from '@/nodes/node-store';
// ... other imports

export class SamplePlayer implements ILibInstrumentNode {
  readonly nodeId: NodeID;
  readonly nodeType = 'sample-player' as const;
  readonly context: AudioContext;

  #initialized = false;
  // ... other private fields

  constructor(
    context: AudioContext,
    polyphony: number = 16,
    audioBuffer?: AudioBuffer,
    midiController?: MidiController
  ) {
    this.nodeId = registerNode('sample-player', this);
    this.context = context;

    // Only synchronous setup here - no async operations
    this.#messages = createMessageBus<Message>(this.nodeId);
    this.#midiController = midiController || null;

    // Create basic nodes synchronously
    this.#masterOut = new GainNode(context, { gain: 0.5 });
    this.outBus = new InstrumentMasterBus();

    // Store configuration for async init
    this.#polyphony = polyphony;
    this.#initialAudioBuffer = audioBuffer;
  }

  async init(): Promise<void> {
    try {
      // Initialize child components first
      await this.outBus.init();

      // Initialize voice pool
      this.voicePool = new SampleVoicePool(
        this.context,
        this.#polyphony,
        this.outBus.input,
        true
      );
      await this.voicePool.init();

      // Setup macro parameters
      this.#macroLoopStart = new MacroParam(
        this.context,
        DEFAULT_PARAM_DESCRIPTORS.LOOP_START
      );
      await this.#macroLoopStart.init();

      this.#macroLoopEnd = new MacroParam(
        this.context,
        DEFAULT_PARAM_DESCRIPTORS.LOOP_END
      );
      await this.#macroLoopEnd.init();

      // Connect audio chain
      this.#connectAudioChain();
      this.#connectVoicesToMacros();
      this.#setupLFOs();
      this.#setupMessageHandling();

      // Load initial sample if provided
      if (this.#initialAudioBuffer) {
        await this.loadSample(this.#initialAudioBuffer);
      }

      this.#initialized = true;
      this.sendUpstreamMessage('sample-player:ready', {});
    } catch (error) {
      // Cleanup any partial initialization
      this.voicePool?.dispose();
      this.#macroLoopStart?.dispose();
      this.#macroLoopEnd?.dispose();

      throw new Error(`Failed to initialize SamplePlayer: ${error.message}`);
    }
  }

  // ... rest of implementation unchanged

  get initialized() {
    return this.#initialized;
  }

  dispose(): void {
    this.voicePool?.dispose();
    this.#macroLoopStart?.dispose();
    this.#macroLoopEnd?.dispose();
    this.outBus?.dispose();
    this.disconnect();
    unregisterNode(this.nodeId);
  }
}

// Only export factory function
export async function createSamplePlayer(
  audioBuffer?: AudioBuffer,
  polyphony: number = 16,
  context?: AudioContext,
  midiController?: MidiController
): Promise<SamplePlayer> {
  // Handle all async dependencies in factory
  await ensureAudioCtx();
  const audioContext = context || getAudioContext();

  const workletResult = await initProcessors(audioContext);
  if (!workletResult.success) {
    throw new Error('AudioWorklet not supported');
  }

  // Get default buffer if needed
  let buffer = audioBuffer;
  if (!buffer) {
    await initIdb();
    buffer = await fetchInitSampleAsAudioBuffer();
  }

  // Create and initialize
  const samplePlayer = new SamplePlayer(
    audioContext,
    polyphony,
    buffer,
    midiController
  );

  await samplePlayer.init();
  return samplePlayer;
}
```
