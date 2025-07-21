export class PlaybackTiming {
  constructor() {
    this.clear();
  }

  clear() {
    this.startTime = null;
    this.stopTime = null;
    this.lengthInSeconds = null;
    this.offsetSeconds = 0;
    this.state = 'idle'; // 'idle', 'playing', 'stopped'
  }

  start(timeToStart, offsetSeconds = 0, lengthInSeconds = null) {
    this.startTime = timeToStart;
    this.offsetSeconds = offsetSeconds;
    this.stopTime = null;
    this.lengthInSeconds = lengthInSeconds;
    this.state = 'playing';
  }

  stop(timeToStop) {
    this.stopTime = timeToStop;
    this.state = 'stopped';
  }

  isActive(now) {
    if (!this.startTime) return false;
    if (now < this.startTime) return false;
    if (this.stopTime && now >= this.stopTime) return false;
    if (this.lengthInSeconds && now >= this.startTime + this.lengthInSeconds)
      return false;

    return true;
  }

  shouldStop(now) {
    if (!this.startTime) return false;
    if (this.stopTime && now >= this.stopTime) return true;
    if (this.lengthInSeconds && now >= this.startTime + this.lengthInSeconds)
      return true;

    return false;
  }

  getPlaybackProgress(now) {
    return {
      currentTime: now,
      elapsedTime: now - this.startTime,
      playbackTime: now - this.startTime + this.offsetSeconds,
    };
  }
}
