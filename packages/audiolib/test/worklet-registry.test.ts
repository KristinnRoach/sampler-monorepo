import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registry } from '../src/nodes/worklet/worklet-registry';
import { generateProcessorCode } from '../src/nodes/worklet/generateProcessorCode';

// Move this section below the imports
import * as ProcessorCodeModule from '../src/nodes/worklet/generateProcessorCode';

// Set up mocks
beforeEach(() => {
  // Mock the generateProcessorCode function
  vi.spyOn(ProcessorCodeModule, 'generateProcessorCode').mockReturnValue(
    'mock-code'
  );
});

// Create a mock AudioContext that implements the necessary properties and methods
class MockAudioContext {
  // Required BaseAudioContext properties
  currentTime = 0;
  destination = {} as AudioDestinationNode;
  sampleRate = 44100;
  state = 'running' as AudioContextState;
  listener = {} as AudioListener;
  onstatechange = null;

  // Methods
  createAnalyser = vi.fn().mockReturnValue({});
  createBiquadFilter = vi.fn().mockReturnValue({});
  createBuffer = vi.fn().mockReturnValue({});
  createBufferSource = vi.fn().mockReturnValue({});
  createChannelMerger = vi.fn().mockReturnValue({});
  createChannelSplitter = vi.fn().mockReturnValue({});
  createConstantSource = vi.fn().mockReturnValue({});
  createConvolver = vi.fn().mockReturnValue({});
  createDelay = vi.fn().mockReturnValue({});
  createDynamicsCompressor = vi.fn().mockReturnValue({});
  createGain = vi.fn().mockReturnValue({});
  createIIRFilter = vi.fn().mockReturnValue({});
  createOscillator = vi.fn().mockReturnValue({});
  createPanner = vi.fn().mockReturnValue({});
  createPeriodicWave = vi.fn().mockReturnValue({});
  createScriptProcessor = vi.fn().mockReturnValue({});
  createStereoPanner = vi.fn().mockReturnValue({});
  createWaveShaper = vi.fn().mockReturnValue({});
  decodeAudioData = vi.fn().mockResolvedValue({});
  resume = vi.fn().mockResolvedValue(undefined);
  suspend = vi.fn().mockResolvedValue(undefined);
  close = vi.fn().mockResolvedValue(undefined);

  // Our mocked worklet
  audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };

  constructor() {
    // Initialize properties if needed
  }
}

describe('WorkletRegistry', () => {
  let mockContext: MockAudioContext;

  beforeEach(() => {
    mockContext = new MockAudioContext();
    vi.clearAllMocks();

    // Set up URL.createObjectURL mock
    if (!window.URL.createObjectURL) {
      // Define it if it doesn't exist in the test environment
      Object.defineProperty(window.URL, 'createObjectURL', {
        value: vi.fn().mockImplementation(() => 'mock-url'),
        writable: true,
      });
    } else {
      // Mock the existing method
      vi.spyOn(URL, 'createObjectURL').mockImplementation(() => 'mock-url');
    }
  });

  it('should register a processor definition', async () => {
    const testProcessor = {
      processFunction: () => {},
      params: [],
    };

    await registry.register(
      mockContext as unknown as BaseAudioContext,
      'test-processor',
      testProcessor
    );

    expect(generateProcessorCode).toHaveBeenCalled();
    expect(mockContext.audioWorklet.addModule).toHaveBeenCalled();
    expect(registry.hasDefinition('test-processor')).toBe(true);
    expect(
      registry.hasRegistered(
        'test-processor',
        mockContext as unknown as BaseAudioContext
      )
    ).toBe(true);
  });

  it('should retrieve a registered processor', async () => {
    const testProcessor = {
      processFunction: () => {},
      params: [],
    };

    await registry.register(
      mockContext as unknown as BaseAudioContext,
      'test-processor',
      testProcessor
    );

    const definition = registry.getDefinition('test-processor');
    expect(definition).toBeDefined();
    expect(definition?.processFunction).toBe(testProcessor.processFunction);
  });

  it('should standardize processor names', async () => {
    const testProcessor = {
      processFunction: () => {},
      params: [],
    };

    // Register with various name formats
    await registry.register(
      mockContext as unknown as BaseAudioContext,
      'TestProcessor',
      testProcessor
    );

    expect(registry.hasDefinition('test-processor')).toBe(true);
    expect(
      registry.hasRegistered(
        'test-processor',
        mockContext as unknown as BaseAudioContext
      )
    ).toBe(true);

    // Try to register with equivalent name
    await registry.register(
      mockContext as unknown as BaseAudioContext,
      'test-processor'
    );

    // Should not call addModule again since it's already registered
    expect(mockContext.audioWorklet.addModule).toHaveBeenCalledTimes(1);
  });

  it('should throw error when registering undefined processor', async () => {
    await expect(
      registry.register(
        mockContext as unknown as BaseAudioContext,
        'unknown-processor'
      )
    ).rejects.toThrow('Processor unknown-processor not defined');
  });

  it('should track processors registered with different contexts', async () => {
    const testProcessor = {
      processFunction: () => {},
      params: [],
    };

    const mockContext2 = new MockAudioContext();

    await registry.register(
      mockContext as unknown as BaseAudioContext,
      'test-processor',
      testProcessor
    );
    await registry.register(
      mockContext2 as unknown as BaseAudioContext,
      'test-processor'
    );

    expect(
      registry.hasRegistered(
        'test-processor',
        mockContext as unknown as BaseAudioContext
      )
    ).toBe(true);
    expect(
      registry.hasRegistered(
        'test-processor',
        mockContext2 as unknown as BaseAudioContext
      )
    ).toBe(true);

    const context1Processors = registry.getRegisteredProcessors(
      mockContext as unknown as BaseAudioContext
    );
    const context2Processors = registry.getRegisteredProcessors(
      mockContext2 as unknown as BaseAudioContext
    );

    expect(context1Processors?.has('test-processor')).toBe(true);
    expect(context2Processors?.has('test-processor')).toBe(true);
  });
});
