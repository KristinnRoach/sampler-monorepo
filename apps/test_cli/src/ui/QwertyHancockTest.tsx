// import { onMount } from 'solid-js';
// import { QwertyHancock } from '../scripts/qwerty-hancock'; // Adjusted import

// interface QwertyHancockTestProps {
//   ctx: AudioContext;
//   onKeyDown: (note: string, frequency: number) => void;
//   onKeyUp: (note: string, frequency: number) => void;
// }

// const QwertyHancockTest = (props: QwertyHancockTestProps) => {
//   let keyboardContainer: HTMLDivElement | undefined;

//   onMount(() => {
//     const keyboard = new QwertyHancock({
//       id: 'keyboard',
//       width: 600,
//       height: 150,
//       octaves: 2,
//       startNote: 'A3',
//       whiteNotesColour: 'white',
//       blackNotesColour: 'black',
//       hoverColour: '#f3e939',
//     });

//     keyboard.keyDown = props.onKeyDown;
//     keyboard.keyUp = props.onKeyUp;

//     if (keyboardContainer) {
//       keyboardContainer.appendChild(keyboard);
//     }
//   });

//   return <div ref={keyboardContainer} id='keyboard'></div>;
// };

// export default QwertyHancockTest;
