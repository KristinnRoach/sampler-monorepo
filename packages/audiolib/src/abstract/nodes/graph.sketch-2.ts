interface INodeX {
  id: string;
  parent?: INodeX;
  children: INodeX[]; // FIRST children only
  addChild(child: INodeX): void; // Only inlcude FIRST level children!
  getLazyChildren?(): Promise<INodeX[]>;

  onNoteOn(): void;
}

class NodeX implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];

  addChild(child: NodeX) {
    child.parent = this;
    this.children.push(child);
  }

  onNoteOn() {
    console.log('Rendering composite');
    this.children.forEach((child) => child.onNoteOn());
  }
}

class Root implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];

  addChild(child: INodeX) {
    child.parent = this;
    this.children.push(child);
  }

  onNoteOn() {
    console.log('Rendering root');
    this.children.forEach((child) => child.onNoteOn());
  }
}

class Container implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];

  addChild(child: INodeX) {
    child.parent = this;
    this.children.push(child);
  }

  onNoteOn() {
    console.log('Rendering container');
    this.children.forEach((child) => child.onNoteOn());
  }
}

class Leaf implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];
  onNoteOn() {
    console.log('Rendering leaf');
  }
  addChild() {
    throw new Error('Leaf nodes cannot have children');
  }
}

class Graph implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];
  addChild(child: INodeX) {
    child.parent = this;
    this.children.push(child);
  }
  onNoteOn() {
    console.log('Rendering graph');
    this.children.forEach((child) => child.onNoteOn());
  }
}

// class FeedbackLoop implements INodeX { ...

class DAG implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];
  addChild(child: INodeX) {
    child.parent = this;
    this.children.push(child);
  }
  onNoteOn() {
    console.log('Rendering DAG');
    this.children.forEach((child) => child.onNoteOn());
  }
}

class Chain implements INodeX {
  id: string = '';
  parent?: INodeX;
  children: INodeX[] = [];

  addChild(child: INodeX) {
    child.parent = this;
    this.children.push(child);
  }

  onNoteOn() {
    console.log('Rendering chain');
    this.children.forEach((child) => child.onNoteOn());
  }
}

// class LazyNode {
//   id: string;
//   private _children?: Node[];

//   get children() {
//     if (!this._children) {
//       this._children = fetchChildrenFromDatabase(this.id);
//     }
//     return this._children;
//   }
// }

//   Complexity in State Management
// Mutating nested nodes requires careful synchronization, especially with shared references. Immutable patterns (e.g., functional updates) mitigate this but add overhead.

// Cycle Risks
// Nodes referencing each other can create undetected cycles, leading to memory leaks or infinite loops. Explicit validation (e.g., acyclic checks) is often necessary.

// Performance Overheads
// Deeply nested structures may incur traversal costs. Hierarchical abstractions help by flattening frequently accessed subgraphs into coarse-grained nodes.

// Type System Limitations
// TypeScript struggles with recursive or self-referential types. Workarounds (e.g., intersection types or any) may compromise type safety.

// Implications
// UI Integration: Nested nodes map naturally to UI components (e.g., Angular’s cdk-nested-tree-node), enabling recursive templating.

// Concurrency: Asynchronous child loading requires handling race conditions during simultaneous expansions.

// Persistence: Serializing/deserializing nested nodes demands strategies to avoid redundancy (e.g., ID-based references).

// Patterns
// 1. Observable-Driven Children
// Use RxJS BehaviorSubject to represent child nodes, enabling reactive updates. For example:

// class Node {
//   children = new BehaviorSubject<Node[]>([]);
//   loadChildren() {
//     /* Fetch data and update children */
//   }
// }
// This pattern simplifies dynamic data loading and UI synchronization.

// 2. Hierarchical Abstraction for Pathfinding
// Group nodes into connected components, represented by parent nodes. Updates to child nodes invalidate only their hierarchical parent, reducing recomputation scope.

// 3. Optional and Array-Valued Fields
// Use SoA with optional fields for sparse child relationships:

// type Node = {
//   id: string;
//   children?: Node[]; // Optional field
//   metadata: SoA<{
//     /* ... */
//   }>; // Memory-efficient storage
// };
// 4. Lazy-Loading Proxies
// Defer child initialization until accessed:

// class LazyNode {
//   private _children?: Node[];
//   get children() {
//     if (!this._children) this._children = fetchChildren();
//     return this._children;
//   }
// }
// 5. Graph Constraints via Invariants
// Enforce acyclic or hierarchical rules using validation hooks:

// function addChild(parent: Node, child: Node) {
//   if (detectCycle(parent, child)) throw Error('Cycle detected');
//   parent.children.push(child);
// }
