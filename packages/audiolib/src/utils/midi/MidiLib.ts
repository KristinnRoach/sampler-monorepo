// import { assert } from '@/utils/code/assert';

// // ? declare ? module ?
// class Midi {
//   export type MidiConvertableUnits = 'Hz' | 'play-rate' | 'period' | 'detune'; //

//   export const isMidiValue = (x?: number) => {
//     return typeof x === 'number' && Number.isInteger(x) && x <= 127 && x >= 0;
//   };

//   export const normalizeMidi = (midiValue: number) => midiValue / 127;

//   export const DEFAULT = {
//     note: 60,
//     note_normalized: normalizeMidi(60),
//     velocity: 100,
//     velocity_normalized: normalizeMidi(100),
//   };

//   export function toFreq(midiValue: number) {
//     assert(
//       isMidiValue(midiValue),
//       `midi values should be in range: 0 to 127
//        received value: ${midiValue}`
//     );

//     return 440 * Math.pow(2, (midiValue - 60) / 12);
//   }
// }

// // todo: type MidiValue
// // export function midiTo(unit: MidiConvertable, midiValue: number) {
// //   switch (unit) {
// //     case 'Hz':
// //       return 440 * Math.pow(2, (midiValue - 60) / 12);
// //   }
// // }
// export default MidiLib;
