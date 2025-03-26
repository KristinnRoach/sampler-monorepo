// positionTrackingFactory.ts - Event Listener Approach

import { createWorkletNode, WorkletNode } from '../base/WorkletNode';
import { AudioParamDescriptor } from '@/types/types';
import { createMessageHandler } from '../base/messageHandlerFactory';

export interface PositionTrackingWorklet extends WorkletNode {
  resetPosition(): void;
  setBufferInfo(length: number): void;
  setReportInterval(frames: number): void;
  onPositionUpdate(
    callback: (position: number, normalized: number) => void
  ): void;
}

// Create message handler for position tracking
const positionTrackerMessageHandler = createMessageHandler({
  reset: function (this: any) {
    this.samplePosition = 0;
    this.frameCounter = 0;
  },

  setBufferInfo: function (this: any, data: { bufferLength: number }) {
    this.totalSamples = data.bufferLength || 0;
  },

  setReportInterval: function (this: any, data: { interval: number }) {
    this.reportInterval = Math.max(1, data.interval || 4);
  },
});

// Process function that will be converted to string and run in audio thread
function positionTrackingProcess(
  this: any,
  inputs: Float32Array[][],
  outputs: Float32Array[][],
  _parameters: Record<string, Float32Array>
): boolean {
  // Pass through audio
  const input = inputs[0];
  const output = outputs[0];

  if (input && input.length > 0) {
    for (
      let channel = 0;
      channel < Math.min(input.length, output.length);
      channel++
    ) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];

      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i];
      }
    }
  }

  // Update position tracking
  this.samplePosition += 128; // Standard buffer size

  // Report position periodically
  if (this.frameCounter % this.reportInterval === 0) {
    this.port.postMessage({
      position: this.samplePosition,
      normalizedPosition:
        this.totalSamples > 0 ? this.samplePosition / this.totalSamples : 0,
    });
  }
  this.frameCounter++;

  return true;
}

export async function createPositionTrackingWorklet(
  context: BaseAudioContext,
  bufferLength?: number
): Promise<PositionTrackingWorklet> {
  const processorName = 'position-tracker';
  const params: AudioParamDescriptor[] = [];

  // Define processor options with state
  const initialState = {
    samplePosition: 0,
    frameCounter: 0,
    reportInterval: 4,
    totalSamples: bufferLength || 0,
  };

  // const nodeOptions: AudioWorkletNodeOptions = {
  //   processorOptions: initialState,
  // };

  const processorOptions = {
    state: initialState,
    messageHandler: positionTrackerMessageHandler,
  };

  // Create worklet node
  const node = await createWorkletNode(
    context,
    processorName,
    positionTrackingProcess,
    params,
    processorOptions
  );

  const positionTrackingNode = node as PositionTrackingWorklet;

  // Add methods to interact with the processor
  positionTrackingNode.resetPosition = () => {
    positionTrackingNode.port.postMessage({ command: 'reset' });
  };

  positionTrackingNode.setBufferInfo = (length: number) => {
    positionTrackingNode.port.postMessage({
      command: 'setBufferInfo',
      bufferLength: length,
    });
  };

  positionTrackingNode.setReportInterval = (frames: number) => {
    positionTrackingNode.port.postMessage({
      command: 'setReportInterval',
      interval: frames,
    });
  };

  // Setup position update callback system
  positionTrackingNode.onPositionUpdate = (callback) => {
    positionTrackingNode.port.onmessage = (event) => {
      if (event.data.position !== undefined) {
        callback(event.data.position, event.data.normalizedPosition);
      }
    };
  };

  // Initialize if buffer length provided
  if (bufferLength) {
    positionTrackingNode.setBufferInfo(bufferLength);
  }

  return positionTrackingNode;
}

// // Define message handler function
// const messageHandler = function (this: any, event: MessageEvent): void {
//   if (event.data.command === 'reset') {
//     this.samplePosition = 0;
//     this.frameCounter = 0;
//   } else if (event.data.command === 'setBufferInfo') {
//     this.totalSamples = event.data.bufferLength || 0;
//   } else if (event.data.command === 'setReportInterval') {
//     this.reportInterval = Math.max(1, event.data.interval || 4);
//   }
// };
