let audioCtx;
let buffer;
let source;

const play = document.getElementById('play');
const stop = document.getElementById('stop');

const loopstartControl = document.getElementById('loopstart-control');
const loopstartValue = document.getElementById('loopstart-value');

const loopendControl = document.getElementById('loopend-control');
const loopendValue = document.getElementById('loopend-value');

function setLoopPoint(sourceNode, point, valueSeconds, interpolateSeconds) {
  if (point === 'start') {
    sourceNode.loopStart.setValueAtTime(valueSeconds, interpolateSeconds);
  } else if (point === 'end') {
    sourceNode.loopEnd.setValueAtTime(valueSeconds, interpolateSeconds);
  }
}

async function loadAudio() {
  try {
    // Load an audio file
    const response = await fetch('piano-c4.mp3');
    // Decode it
    buffer = await audioCtx.decodeAudioData(await response.arrayBuffer());
    // const max = Math.floor(buffer.duration);
    // loopstartControl.setAttribute('max', max);
    // loopendControl.setAttribute('max', max);
  } catch (err) {
    console.error(`Unable to fetch the audio file. Error: ${err.message}`);
  }
}

play.addEventListener('click', async () => {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    await loadAudio();
  }
  source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.loop = true;
  source.loopStart = loopstartControl.value;
  source.loopEnd = loopendControl.value;
  source.start();
  play.disabled = true;
  stop.disabled = false;
  loopstartControl.disabled = false;
  loopendControl.disabled = false;
});

stop.addEventListener('click', () => {
  source.stop();
  play.disabled = false;
  stop.disabled = true;
  loopstartControl.disabled = true;
  loopendControl.disabled = true;
});

loopstartControl.addEventListener('input', () => {
  const interpolationDuration = loopendControl.value - loopstartControl.value;
  setLoopPoint(source, 'start', loopstartControl.value, 0.1);
  loopstartValue.textContent = loopstartControl.value;
});

loopendControl.addEventListener('input', () => {
  const interpolationDuration = loopendControl.value - loopstartControl.value;
  setLoopPoint(source, 'end', loopendControl.value, 0.1);
  loopendValue.textContent = loopendControl.value;
});
