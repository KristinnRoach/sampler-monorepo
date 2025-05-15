import { createNodeId, deleteNodeId, NodeID } from '@/nodes/node-store';
import { LibVoiceNode } from '@/LibNode';
import { assert } from '@/utils';

export class VoicePool {
  readonly nodeId: NodeID;
  readonly nodeType = 'pool'; // ContainerType
  #allocationStrategy = 'LRU'; // for now

  #available = new Set<LibVoiceNode>();
  #playing = new Set<LibVoiceNode>(); // check if Map with Midi notes is needed
  #releasing = new Set<LibVoiceNode>();

  constructor() {
    this.nodeId = createNodeId(this.nodeType);
  }

  reserveVoice() {
    let voice;
    if (this.#available.size) voice = this.#pop(this.#available);
    else if (this.#releasing.size) voice = this.#pop(this.#releasing);
    else if (this.#playing.size) voice = this.#pop(this.#playing); // (pop uneccessary but maybe better for constistant behavior..)

    // ? decide and clearly define the system for adding to the sets:
    // a) messages from processor handle populating the sets exclusively,
    // OR sets populated explicitly in:
    // b) Sampler class
    // c) Pool class

    // Simple version for now (only for the "playing" set):
    this.#playing.add(voice);

    return voice;
  }

  releaseVoice(voice: LibVoiceNode) {
    if (this.#playing.has(voice)) {
      this.#playing.delete(voice);
      this.#releasing.add(voice);
    } else {
      console.warn(`tried to release non-playing voice: ${voice}`);
    }
  }

  stopVoice(voice: LibVoiceNode) {
    if (this.#releasing.has(voice)) {
      this.#releasing.delete(voice);
      this.#available.add(voice);
    } else {
      console.warn(
        `tried to stop non-releasing voice: 
        id: ${voice.nodeId},
        releasing: ${this.#releasing.forEach((v) => v.nodeId)},
        playing: ${this.#playing.forEach((v) => v.nodeId)},
        available: ${this.#available.forEach((v) => v.nodeId)}.
        `
      );
    }
  }

  #pop = (set: Set<any>) => {
    const v = set.values().next().value;
    set.delete(v);
    return v;
  };

  add(node: LibVoiceNode) {
    this.#available.add(node);
    assert(!this.#playing.has(node) && !this.#releasing.has(node));
  }

  remove(node: LibVoiceNode) {
    if (this.#available.has(node)) this.#available.delete(node);
    if (this.#releasing.has(node)) {
      node.stop();
      this.#releasing.delete(node);
    }
    if (this.#playing.has(node)) {
      node.stop();
      this.#playing.delete(node);
    }
  }

  // Check if pool has any available voices
  get hasAvailableVoices(): boolean {
    return this.#available.size > 0;
  }

  // Find a voice by ID
  findVoiceById(id: string): LibVoiceNode | undefined {
    return this.allVoices.find((voice) => voice.nodeId === id);
  }

  // Get state of a specific voice
  getVoiceState(
    voice: LibVoiceNode
  ): 'available' | 'playing' | 'releasing' | 'unknown' {
    if (this.#available.has(voice)) return 'available';
    if (this.#playing.has(voice)) return 'playing';
    if (this.#releasing.has(voice)) return 'releasing';
    return 'unknown';
  }

  // Safe ways to access the underlying collections
  get availableVoices(): LibVoiceNode[] {
    return Array.from(this.#available);
  }

  get playingVoices(): LibVoiceNode[] {
    return Array.from(this.#playing);
  }

  get releasingVoices(): LibVoiceNode[] {
    return Array.from(this.#releasing);
  }

  get allVoices(): LibVoiceNode[] {
    return [
      ...this.availableVoices,
      ...this.playingVoices,
      ...this.releasingVoices,
    ];
  }

  // Getters for pool stats
  get availableCount(): number {
    return this.#available.size;
  }

  get playingCount(): number {
    return this.#playing.size;
  }

  get releasingCount(): number {
    return this.#releasing.size;
  }

  get totalCount(): number {
    return this.availableCount + this.playingCount + this.releasingCount;
  }

  dispose() {
    deleteNodeId(this.nodeId);
  }
}

//   add(node: TEMP_FLEX): this {
//     this.#nodes.push(node);
//     this.#available.add(node);

//     // LibVoiceNode - clarify and concentrate in one place
//     node.onMessage('voice:ended', () => {
//       if (this.#active.has(node)) this.#active.delete(node);
//       if (!this.#available.has(node)) this.#available.add(node);
//     });

//     node.onMessage('voice:started', () => {
//       if (this.#available.has(node)) this.#available.delete(node);
//       if (!this.#active.has(node)) this.#active.add(node);
//     });

//     return this;
//   }

//   remove(child: TEMP_FLEX): this {
//     // LibVoiceNode
//     return this;
//   }

//   allocateNode(): TEMP_FLEX | null {
//     if (this.#available.size === 0) {
//       console.warn(`no available voices in pool, size 0`);
//       return null;
//     }

//     const node = this.#allocationStrategy.allocate(this.#available);
//     if (!node) {
//       console.debug(`unable to allocate node using strategy`);
//       return null;
//     }
//     this.#available.delete(node);
//     this.#active.add(node);

//     return node;
//   }

//   returnNode(node: TEMP_FLEX): this {
//     if (this.#active.has(node)) {
//       this.#active.delete(node);
//     }
//     if (!this.#available.has(node)) {
//       this.#available.add(node);
//     }
//     return this;
//   }

//   connect(destination: AudioNode | AudioParam): this {
//     this.#nodes.forEach((node) => node.connect(destination));
//     return this;
//   }

//   disconnect(): this {
//     this.#nodes.forEach((node) => node.disconnect());
//     return this;
//   }

//   applyToActive(callback: (node: TEMP_FLEX) => void): this {
//     if (this.#active.size === 0) return this;
//     this.#active.forEach(callback);
//     return this;
//   }

//   applyToAll(callback: (node: TEMP_FLEX) => void): this {
//     if (this.#nodes.length === 0) return this;
//     this.#nodes.forEach(callback);
//     return this;
//   }

//   async asyncApplyToAll(
//     callback: (node: TEMP_FLEX) => Promise<void>
//   ): Promise<void> {
//     if (this.#nodes.length === 0) return;
//     await Promise.all(this.#nodes.map(callback));
//   }

//   dispose(): void {
//     this.#nodes.forEach((node) => {
//       node.dispose();
//     });

//     this.#nodes = [];
//     this.#available.clear();
//     this.#active.clear();
//     deleteNodeId(this.nodeId);
//   }

//   // Simple getters

//   get now() {
//     return getAudioContext().currentTime;
//   }

//   get nodes(): TEMP_FLEX[] {
//     return [...this.#nodes];
//   }

//   get activeCount(): number {
//     return this.#active.size;
//   }

//   get availableCount(): number {
//     return this.#available.size;
//   }
// }
