/**
 * Audio Worklet Utilities
 * A set of utility functions for working with AudioWorklet processors
 */

/**
 * Loads an AudioWorklet module from either a path or embedded code
 * @param context The AudioContext
 * @param embeddedCode Optional embedded code as a string
 * @param processorPath Optional path to the processor code
 * @returns Promise that resolves when the module is loaded
 */
export async function loadAudioWorkletModule(
  context: AudioContext,
  embeddedCode?: string,
  processorPath?: string
): Promise<void> {
  if (processorPath) {
    // Use provided path if available
    await context.audioWorklet.addModule(processorPath);
    return;
  }

  if (embeddedCode) {
    // Use the embedded code with Blob URL
    const blob = new Blob([embeddedCode], {
      type: 'application/javascript',
    });
    const workletUrl = URL.createObjectURL(blob);

    try {
      await context.audioWorklet.addModule(workletUrl);
    } finally {
      // Always clean up the URL to avoid memory leaks
      URL.revokeObjectURL(workletUrl);
    }
    return;
  }

  throw new Error('Either processorPath or embeddedCode must be provided');
}

/**
 * Creates and initializes an AudioWorkletNode with common setup
 * @param context The AudioContext
 * @param processorName The name of the processor
 * @param options Optional AudioWorkletNodeOptions
 * @param messageHandler Optional message handler function
 * @returns The created AudioWorkletNode
 */
export function createAudioWorkletNode(
  context: AudioContext,
  processorName: string,
  options?: AudioWorkletNodeOptions,
  messageHandler?: (event: MessageEvent) => void
): AudioWorkletNode {
  const workletNode = new AudioWorkletNode(context, processorName, options);

  // Set up message handling if provided
  if (messageHandler) {
    workletNode.port.onmessage = messageHandler;
  }

  return workletNode;
}

/**
 * Initializes an AudioWorklet with common setup
 * @param context The AudioContext
 * @param processorName The name of the processor
 * @param options Configuration options
 * @returns Promise that resolves to the created AudioWorkletNode
 */
export async function initializeAudioWorklet(
  context: AudioContext,
  processorName: string,
  options: {
    embeddedCode?: string;
    processorPath?: string;
    nodeOptions?: AudioWorkletNodeOptions;
    messageHandler?: (event: MessageEvent) => void;
    outputNode?: AudioNode;
  } = {}
): Promise<AudioWorkletNode> {
  try {
    // Load the worklet module
    await loadAudioWorkletModule(
      context,
      options.embeddedCode,
      options.processorPath
    );

    // Create the processor node
    const workletNode = createAudioWorkletNode(
      context,
      processorName,
      options.nodeOptions,
      options.messageHandler
    );

    // Connect to output if provided
    if (options.outputNode) {
      workletNode.connect(options.outputNode);
    }

    return workletNode;
  } catch (error) {
    console.error(`Failed to initialize ${processorName}:`, error);
    throw error;
  }
}

/**
 * A utility type for standardized AudioWorklet messages
 */
export interface WorkletMessage<T = any> {
  type: string;
  data?: T;
}

/**
 * Send a message to an AudioWorkletNode
 * @param node The AudioWorkletNode to send the message to
 * @param type The message type
 * @param data Optional data to include with the message
 * @param transferables Optional array of transferable objects
 */
export function sendWorkletMessage<T = any>(
  node: AudioWorkletNode,
  type: string,
  data?: T,
  transferables?: Transferable[]
): void {
  node.port.postMessage({ type, data }, transferables || []);
}

/**
 * Set an AudioParam value at the current time
 * @param node The AudioWorkletNode containing the parameter
 * @param paramName The name of the parameter to set
 * @param value The value to set
 * @param context The AudioContext
 */
export function setWorkletParam(
  node: AudioWorkletNode,
  paramName: string,
  value: number,
  context: AudioContext
): void {
  const param = node.parameters.get(paramName);
  if (param) {
    param.setValueAtTime(value, context.currentTime);
  }
}

/**
 * Set multiple AudioParam values at once
 * @param node The AudioWorkletNode
 * @param params Object mapping parameter names to values
 * @param context The AudioContext
 */
export function setWorkletParams(
  node: AudioWorkletNode,
  params: Record<string, number>,
  context: AudioContext
): void {
  Object.entries(params).forEach(([paramName, value]) => {
    if (value !== undefined) {
      setWorkletParam(node, paramName, value, context);
    }
  });
}
