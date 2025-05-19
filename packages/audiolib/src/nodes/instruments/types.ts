/** SHARED TYPES (for instruments) **/

export type MidiValue = number; // todo: update when MIDI input is implemented
export type ActiveNoteId = number;

export const ADSR_Phase = {
  ATTACK: 'ATTACK',
  DECAY: 'DECAY',
  SUSTAIN: 'SUSTAIN',
  RELEASE: 'RELEASE',
} as const;

export type ADSR_Phase = (typeof ADSR_Phase)[keyof typeof ADSR_Phase];

export const VoiceState = {
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  RELEASING: 'RELEASING',
  STOPPED: 'STOPPED',
} as const;

export type VoiceState = (typeof VoiceState)[keyof typeof VoiceState];

/* Usage example:
function setVoiceState(state: VoiceState) {
  if (state === VoiceState.PLAYING) { ... 
*/
