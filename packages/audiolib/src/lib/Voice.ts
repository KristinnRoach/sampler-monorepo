// packages/audiolib/src/lib/Voice.ts
import { AudioPlayer } from './AudioPlayer';
import type { AudioPlayerOptions } from './types';

export class Voice {
  private player: AudioPlayer;
  private noteNumber: number = -1;

  constructor(audioBuffer: AudioBuffer, options?: AudioPlayerOptions) {
    this.player = new AudioPlayer(options);
    this.player.load(audioBuffer);
  }

  async trigger(noteNumber: number, velocity: number = 1) {
    this.noteNumber = noteNumber;
    this.player.setVolume(velocity);
    this.player.play();
  }

  release() {
    this.player.stop();
    this.noteNumber = -1;
  }

  get currentNote(): number {
    return this.noteNumber;
  }

  get isPlaying(): boolean {
    return this.player.isPlaying();
  }

  setLoopPoints(start: number, end: number) {
    // Update loop points in AudioPlayer
    if (this.player) {
      this.player.setLoopPoints(start, end);
    }
  }

  setLoopEnabled(enabled: boolean) {
    if (this.player) {
      this.player.setLoopEnabled(enabled);
    }
  }
}
