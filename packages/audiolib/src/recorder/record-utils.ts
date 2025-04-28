export async function createMediaRecorder(
  stream: MediaStream
): Promise<MediaRecorder> {
  return new MediaRecorder(stream, {
    mimeType: 'audio/webm',
  });
}

export function startRecording(recorder: MediaRecorder): void {
  if (recorder.state === 'inactive') {
    recorder.start();
  }
}

export function stopRecording(recorder: MediaRecorder): Promise<Blob> {
  return new Promise((resolve) => {
    if (recorder.state !== 'inactive') {
      recorder.addEventListener(
        'dataavailable',
        (e) => {
          resolve(e.data);
        },
        { once: true }
      );
      recorder.stop();
    }
  });
}

export async function blobToAudioBuffer(
  blob: Blob,
  context: AudioContext
): Promise<AudioBuffer> {
  const arrayBuffer = await blob.arrayBuffer();
  return await context.decodeAudioData(arrayBuffer);
}
