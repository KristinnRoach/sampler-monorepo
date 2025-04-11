import { SourceNode } from './SourceNode';

class SourceNodePool {
  private context: AudioContext;
  private buffer: AudioBuffer | null;
  private nodes: SourceNode[];
  private available: SourceNode[];
  private destination: AudioNode;
  private poolSize: number; // polyphony
  private initPromise: Promise<void> | null = null;

  constructor(context: AudioContext, destination: AudioNode, poolSize = 8) {
    this.context = context;
    this.buffer = null;
    this.nodes = [];
    this.available = [];
    this.destination = destination;
    this.poolSize = poolSize;
  }

  // Initialize the pool with a buffer
  async init(buffer: AudioBuffer): Promise<void> {
    // Only initialize once
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      this.buffer = buffer;
      this.nodes = [];
      this.available = [];

      // Create poolSize nodes
      for (let i = 0; i < this.poolSize; i++) {
        const node = await SourceNode.create(this.context, { buffer });
        node.connect(this.destination);

        // When playback ends, return to pool
        node.addEventListener('ended', () => this.returnNode(node));

        this.nodes.push(node);
        this.available.push(node);
      }
    })();

    return this.initPromise;
  }

  // Play a sound with specified parameters
  play(
    options: {
      when?: number;
      offset?: number;
      duration?: number;
      playbackRate?: number;
      loop?: boolean;
      loopStart?: number;
      loopEnd?: number;
    } = {}
  ): SourceNode | null {
    // Get available node
    const node = this.available.pop();
    if (!node) {
      console.warn('SourceNodePool: No available nodes');
      return null;
    }

    // Apply parameters
    if (options.playbackRate !== undefined) {
      node.playbackRate.value = options.playbackRate;
    }

    if (options.loop !== undefined) {
      node.loop.value = options.loop ? 1 : 0;
    }

    if (options.loopStart !== undefined) {
      node.loopStart.value = options.loopStart;
    }

    if (options.loopEnd !== undefined) {
      node.loopEnd.value = options.loopEnd;
    }

    // Start playback
    node.start(options.when || 0, options.offset || 0, options.duration);

    return node;
  }

  // Return a node to the available pool
  private returnNode(node: SourceNode): void {
    // Check if node is already in available pool
    if (this.available.includes(node)) return;

    // Reset node parameters to defaults
    node.playbackRate.value = 1;
    node.loop.value = 0;
    node.loopStart.value = 0;
    node.loopEnd.value = 0;

    // Add back to available pool
    this.available.push(node);
  }

  // Get count of available nodes
  get availableCount(): number {
    return this.available.length;
  }

  // Get total pool size
  get size(): number {
    return this.nodes.length;
  }

  // Optional: expand pool if needed
  async expandPool(additionalNodes: number): Promise<void> {
    if (!this.buffer) throw new Error('Cannot expand uninitialized pool');

    for (let i = 0; i < additionalNodes; i++) {
      const node = await SourceNode.create(this.context, {
        buffer: this.buffer,
      });
      node.connect(this.destination);
      node.addEventListener('ended', () => this.returnNode(node));

      this.nodes.push(node);
      this.available.push(node);
    }

    this.poolSize = this.nodes.length;
  }
}

export { SourceNodePool };
