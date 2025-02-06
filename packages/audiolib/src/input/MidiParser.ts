// // Midi parser - Example idea - not used in the project

// import { MidiMessage } from './MidiMessage';
// import { MidiMessageTypes } from './MidiMessageTypes';
// import { MidiMessageNoteOn } from './MidiMessageNoteOn';
// import { MidiMessageNoteOff } from './MidiMessageNoteOff';
// import { MidiMessageControlChange } from './MidiMessageControlChange';
// import { MidiMessageProgramChange } from './MidiMessageProgramChange';

// export class MidiParser {
//   static parse(data: Uint8Array): MidiMessage {
//     const statusByte = data[0];
//     const type = statusByte >> 4;
//     const channel = statusByte & 0x0f;
//     const message = data.slice(1);

//     switch (type) {
//       case MidiMessageTypes.NoteOn:
//         return new MidiMessageNoteOn(channel, message[0], message[1]);
//       case MidiMessageTypes.NoteOff:
//         return new MidiMessageNoteOff(channel, message[0], message[1]);
//       case MidiMessageTypes.ControlChange:
//         return new MidiMessageControlChange(channel, message[0], message[1]);
//       case MidiMessageTypes.ProgramChange:
//         return new MidiMessageProgramChange(channel, message[0]);
//       default:
//         return new MidiMessage(type, channel, message);
//     }
//   }
// }
