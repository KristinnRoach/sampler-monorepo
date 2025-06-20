export const VoiceState = {
  NOT_READY: 'NOT_READY',
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  LOOPING: 'LOOPING', // ADD TO VOICE
  RELEASING: 'RELEASING',
  STOPPING: 'STOPPING', // REMOVE if redundant
  STOPPED: 'STOPPED',
} as const;

export type VoiceState = (typeof VoiceState)[keyof typeof VoiceState];

/* Usage example:
function setVoiceState(state: VoiceState) {
  if (state === VoiceState.PLAYING) { ... 
*/
