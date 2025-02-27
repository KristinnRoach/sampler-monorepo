let audioCtx: AudioContext;
let bufferData: AudioBuffer;
let workletNode: AudioWorkletNode;

async function setupAudio() {
  audioCtx = new AudioContext();

  // Load audio worklet
  await audioCtx.audioWorklet.addModule('loop-interpolator-processor.js');

  // Load audio file
  const response = await fetch('piano-c4.mp3');
  bufferData = await audioCtx.decodeAudioData(await response.arrayBuffer());

  // Create and configure worklet node
  workletNode = new AudioWorkletNode(audioCtx, 'loop-interpolator');
  workletNode.connect(audioCtx.destination);

  // Send buffer data to worklet
  workletNode.port.postMessage({
    type: 'setBuffer',
    buffer: bufferData.getChannelData(0),
  });
}

function updateLoopPoints(loopStart: number, loopEnd: number) {
  workletNode.parameters.get('targetLoopStart').value = loopStart;
  workletNode.parameters.get('targetLoopEnd').value = loopEnd;
}
