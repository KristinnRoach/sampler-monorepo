// Example 1: Basic setup with audio file loading
async function setupBasicPlayer(samplePath) {
  // Create audio context
  const audioContext = new AudioContext();

  // Register the worklet processor (only needs to be done once)
  await audioContext.audioWorklet.addModule('./source-processor.js');

  // Create the player instance
  const player = new SourcePlayer(audioContext);

  // Connect to audio output
  player.connect(audioContext.destination);

  // Load an audio file
  const response = await fetch(samplePath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Load the decoded buffer into our player
  await player.loadBuffer(audioBuffer);

  // Play with default settings
  player.play();

  return player;
}

// Example 2: Advanced setup with effects chain
async function setupPlayerWithEffects() {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('./source-processor.js');

  // Create effects
  const filter = new BiquadFilterNode(audioContext, {
    type: 'lowpass',
    frequency: 1000,
  });

  const delay = new DelayNode(audioContext, {
    delayTime: 0.5,
    maxDelayTime: 2,
  });

  const feedback = new GainNode(audioContext, {
    gain: 0.4,
  });

  const reverb = audioContext.createConvolver();
  // Load impulse response for reverb...

  // Create the player with initial options
  const player = new SourcePlayer(audioContext, {
    processorOptions: {
      // Any options to pass to the processor
    },
  });

  // Set up the effects chain
  player.connect(filter);
  filter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  delay.connect(reverb);
  reverb.connect(audioContext.destination);

  // Set up player parameters
  player
    .setLoop(true, 1.2, 4.8) // Loop from 1.2s to 4.8s
    .setRate(0.9); // Slightly slower playback

  return {
    player,
    effects: {
      filter,
      delay,
      feedback,
      reverb,
    },
  };
}

// Example 3: Multiple players with shared resources
async function createMultiplePlayers(audioBuffers) {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('./source-processor.js');

  // Create a mixer
  const mixer = new GainNode(audioContext, { gain: 1.0 });
  mixer.connect(audioContext.destination);

  // Create players for each buffer
  const players = [];

  for (const buffer of audioBuffers) {
    // Create player with custom volume
    const volume = new GainNode(audioContext, { gain: 0.8 });

    const player = new SourcePlayer(audioContext);
    await player.loadBuffer(buffer);

    // Connect player -> volume -> mixer
    player.connect(volume);
    volume.connect(mixer);

    // Add to our array
    players.push({
      player,
      volume,
    });
  }

  return {
    context: audioContext,
    players,
    mixer,
  };
}

// Example 4: Using with AudioParam modulation
async function setupModulatedPlayer(samplePath) {
  const audioContext = new AudioContext();
  await audioContext.audioWorklet.addModule('./source-processor.js');

  // Create LFO for playback rate modulation
  const lfo = new OscillatorNode(audioContext, {
    frequency: 0.5, // 0.5 Hz modulation
    type: 'sine',
  });

  // Scale LFO output from 0.8 to 1.2 range
  const lfoGain = new GainNode(audioContext, { gain: 0.2 });
  const lfoOffset = new ConstantSourceNode(audioContext, { offset: 1.0 });

  // Create player
  const player = new SourcePlayer(audioContext);

  // Connect LFO to playback rate
  lfo.connect(lfoGain);
  lfoGain.connect(player.playbackRate);
  lfoOffset.connect(player.playbackRate);

  // Start modulation
  lfo.start();
  lfoOffset.start();

  // Load and play audio
  const response = await fetch(samplePath);
  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  await player.loadBuffer(audioBuffer);
  player.connect(audioContext.destination);

  // Configure with event listeners
  player.addEventListener('ended', () => {
    console.log('Playback ended');
    // Additional cleanup if needed
  });

  player.setLoop(true).play();

  return {
    player,
    lfo,
    lfoGain,
    lfoOffset,
  };
}

// Example 5: Player factory with error handling
class PlayerFactory {
  constructor() {
    this.context = null;
    this.workletLoaded = false;
    this.bufferCache = new Map();
  }

  async initialize() {
    if (this.context) return;

    try {
      this.context = new AudioContext();
      await this.context.audioWorklet.addModule('./source-processor.js');
      this.workletLoaded = true;
    } catch (error) {
      console.error('Failed to initialize player factory:', error);
      throw new Error('Audio system initialization failed');
    }
  }

  async loadAudioFile(url) {
    // Check cache first
    if (this.bufferCache.has(url)) {
      return this.bufferCache.get(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);

      // Store in cache
      this.bufferCache.set(url, audioBuffer);
      return audioBuffer;
    } catch (error) {
      console.error(`Failed to load audio from ${url}:`, error);
      throw error;
    }
  }

  async createPlayer(options = {}) {
    if (!this.workletLoaded) {
      await this.initialize();
    }

    try {
      const player = new SourcePlayer(this.context, options);

      // If URL provided, load it
      if (options.audioUrl) {
        const buffer = await this.loadAudioFile(options.audioUrl);
        await player.loadBuffer(buffer);
      }

      // Configure defaults if specified
      if (options.loop !== undefined) {
        player.setLoop(options.loop, options.loopStart, options.loopEnd);
      }

      if (options.rate !== undefined) {
        player.setRate(options.rate);
      }

      // Connect to destination by default
      if (options.autoConnect !== false) {
        player.connect(options.destination || this.context.destination);
      }

      return player;
    } catch (error) {
      console.error('Failed to create player:', error);
      throw error;
    }
  }

  disposePlayer(player) {
    if (player) {
      player.stop();
      player.disconnect();
    }
  }
}

// Usage of the factory
async function demonstratePlayerFactory() {
  const factory = new PlayerFactory();
  await factory.initialize();

  // Create multiple players with different settings
  const drums = await factory.createPlayer({
    audioUrl: 'drums.mp3',
    loop: true,
  });

  const bass = await factory.createPlayer({
    audioUrl: 'bass.mp3',
    loop: true,
    rate: 0.95,
  });

  const lead = await factory.createPlayer({
    audioUrl: 'lead.mp3',
    loop: false,
  });

  // Start playback
  drums.play();
  bass.play();

  // Play lead after 2 seconds
  setTimeout(() => lead.play(), 2000);

  // Clean up after 10 seconds
  setTimeout(() => {
    factory.disposePlayer(drums);
    factory.disposePlayer(bass);
    factory.disposePlayer(lead);
  }, 10000);
}
