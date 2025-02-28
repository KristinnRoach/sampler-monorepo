// src/recording/AudioRecorder.ts

import { BaseEventTarget } from '../base/BaseEventTarget.js';

// Todo: make proper types
// Todo: create utility functions and swappable strategies for cleaner code and optional features (e.g. arm, threshold)

/**
 * Audio recorder that uses EventTarget for state updates
 */
export class AudioRecorder extends BaseEventTarget {
  private mediaRecorder = null;
  private stream = null;
  private audioChunks = [];
  private isRecording = false;

  /**
   * Subscribable emitted events
   * Usage: audioRecorder.addEventListener('recording:start', () => { ... });
   */
  static EVENTS = {
    START: 'recording:start',
    STOP: 'recording:stop',
    DATA: 'recording:data',
    COMPLETE: 'recording:complete',
    ERROR: 'recording:error',
  } as const;

  /**
   * Start recording audio
   */
  async startRecording() {
    if (this.isRecording) return;

    try {
      this.audioChunks = [];
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      this.mediaRecorder = new MediaRecorder(this.stream);
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          this.notifyListeners('recording:data', { data: event.data });
        }
      };

      this.mediaRecorder.addEventListener('stop', async () => {
        if (this.stream) {
          this.stopStream(this.stream);
          this.stream = null;
        }

        if (this.audioChunks.length > 0) {
          const blob = new Blob(this.audioChunks, { type: 'audio/wav' });
          const arrayBuffer = await blob.arrayBuffer();
          this.notifyListeners('recording:complete', { arrayBuffer, blob });
        }
      });

      this.mediaRecorder.start();
      this.isRecording = true;
      this.notifyListeners('recording:start');
    } catch (error) {
      this.notifyListeners('recording:error', { error });
      throw error;
    }
  }

  /**
   * Stop recording audio
   */
  async stopRecording() {
    if (!this.mediaRecorder || !this.isRecording) return;

    return new Promise<void>((resolve) => {
      const onStop = () => {
        this.isRecording = false;
        this.notifyListeners('recording:stop');

        this.dispose(); // OK to dispose here ???
        resolve();
      };

      this.mediaRecorder.addEventListener('stop', onStop, { once: true });
      this.mediaRecorder.stop();
    });
  }

  stopStream(stream: MediaStream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  /**
   * Check if currently recording
   */
  getIsRecording() {
    return this.isRecording;
  }

  /**
   * Release resources
   */
  dispose() {
    if (this.isRecording) {
      this.stopRecording();
    }

    if (this.stream) {
      this.stopStream(this.stream);
      this.stream = null;
    }

    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

/**
 * Factory function to create audio recorder
 */
export function createAudioRecorder() {
  return new AudioRecorder();
}
