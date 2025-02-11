export function fetchAudioBuffer(
  url: string,
  audioContext: AudioContext
): Promise<AudioBuffer> {
  return fetch(url)
    .then((response) => response.arrayBuffer())
    .then((buffer) => audioContext.decodeAudioData(buffer));
}
