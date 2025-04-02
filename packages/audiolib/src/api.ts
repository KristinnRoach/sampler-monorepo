type Id = string | number; // | symbol; // TODO -> Standardize id's

interface Node {
  getId(): Id;
  init?(initState: TODO): Promise<boolean> | boolean;
  dispose(): boolean;
  connect(source: this, destination: Node): boolean;
  disconnect(id?: Id): boolean;
  //   getConnections(): id[][]; // TODO: Should this be a Map<id, Node>?
}

interface createNode {
  (nodeType: string, nodeId: Id, nodeOptions?: Record<string, unknown>): Node;
}

/* Starting with only essential methods */
interface AudioLib extends Node {
  createAudioGraph: () => Id; // could be same as addNode, init,
  deleteAudioGraph: (id: Id) => boolean;
  getAudioGraph: (id: Id) => Chain;
  dispose: () => boolean;
}

interface Chain {
  nodes: Node[];
  addNode: (node: Node) => boolean;
  removeNode: (node: Node) => boolean;
}

// MAYBE ef ég nenni
// interface Graph {
//   addNode: (node: Node) => boolean;
//   removeNode: (node: Node) => boolean;
// }

// interface NodeFactory {
//   createNode: createNode;
//   createSourceNode: (
//     nodeId: id,
//     nodeOptions?: Record<string, unknown>
//   ) => SourceNode;
//   createDestinationNode: (
//     nodeId: id,
//     nodeOptions?: Record<string, unknown>
//   ) => Node;
//   createProcessorNode: (
//     nodeId: id,
//     nodeOptions?: Record<string, unknown>
//   ) => Node;
// }

// interface SourceNode extends Node {
//   start(): () => boolean;
//   stop(): () => boolean;
// }
