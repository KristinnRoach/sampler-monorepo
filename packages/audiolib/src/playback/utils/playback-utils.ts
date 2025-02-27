// Interpolation example:
// source.loopEnd.setValueAtTime(1.0, currentTime);
// // Schedule a linear ramp to the target value over 5 seconds
// source.loopEnd.linearRampToValueAtTime(2.0, currentTime + 5);

function setLoopPoint(
  sourceNode,
  point: 'start' | 'end',
  value: number,
  time: number
) {
  if (point === 'start') {
    sourceNode.loopStart.setValueAtTime(value, time);
  } else {
    sourceNode.loopEnd.setValueAtTime(value, time);
  }
}
