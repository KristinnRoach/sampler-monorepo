import { ensureAudioCtx } from '@repo/audiolib';

const getCtx = async () => await ensureAudioCtx();

const context = await getCtx();
if (!context) {
  throw new Error('Audio context not available');
}

const nodes = new Map();

// context.suspend();

const osc = context.createOscillator();
osc.frequency.value = 220;
osc.type = 'square';
osc.start();

const amp = context.createGain();
amp.gain.value = 0.5;

osc.connect(amp);
amp.connect(context.destination);

nodes.set('osc', osc);
nodes.set('amp', amp);
nodes.set('output', context.destination);

export function isRunning() {
  return context.state === 'running';
}

export function toggleAudio() {
  return isRunning() ? context.suspend() : context.resume();
}

export function createAudioNode(id: string, type: string, data: any) {
  switch (type) {
    case 'osc': {
      const node = context.createOscillator();
      node.frequency.value = data.frequency;
      node.type = data.type;
      node.start();

      nodes.set(id, node);
      break;
    }

    case 'amp': {
      const node = context.createGain();
      node.gain.value = data.gain;

      nodes.set(id, node);
      break;
    }
  }
}

export function updateAudioNode(id: string, data: any) {
  const node = nodes.get(id);

  for (const [key, val] of Object.entries(data)) {
    if (node[key] instanceof AudioParam) {
      // @ts-ignore
      node[key].value = val;
    } else {
      node[key] = val;
    }
  }
}

export function removeAudioNode(id: string): void {
  const node = nodes.get(id) as AudioNode;

  node.disconnect();
  (node as OscillatorNode).stop?.();

  nodes.delete(id);
}

export function connect(sourceId: string, targetId: string): void {
  const source = nodes.get(sourceId) as AudioNode;
  const target = nodes.get(targetId) as AudioNode;

  source.connect(target);
}

export function disconnect(sourceId: string, targetId: string): void {
  const source = nodes.get(sourceId) as AudioNode;
  const target = nodes.get(targetId) as AudioNode;

  source.disconnect(target);
}
