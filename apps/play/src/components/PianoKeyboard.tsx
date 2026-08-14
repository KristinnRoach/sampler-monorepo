import { createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { KeyMap, SamplePlayer } from '@kidlib/web-audio';
import { COMPONENT_STYLE } from '@/shared/styles/component-styles';
import { ROOT_NOTES, type RootNote } from './RootNoteSelect';
import '../audio-elements/webaudio-keyboard';

const MOBILE_KEY_COUNT = 13;
const DESKTOP_KEY_COUNT = 25;
const MOBILE_MIN_NOTE = 48;

type PianoPointerEvent = Event & { note: [0 | 1, number] };

type PianoKeyboardProps = {
  player: SamplePlayer | null;
  keymap: KeyMap;
  octaveOffset: number;
  rootNote: RootNote;
  pressedNotes: ReadonlySet<number>;
  height?: number;
};

const getRootNoteOffset = (rootNote: RootNote) =>
  ROOT_NOTES.indexOf(rootNote);

const PianoKeyboard = (props: PianoKeyboardProps) => {
  let keyboard!: WebAudioKeyboardElement;
  const mobileQuery = window.matchMedia('(max-width: 600px)');
  const [isMobile, setIsMobile] = createSignal(mobileQuery.matches);
  let displayedPressedNotes = new Set<number>();

  const getDisplayRange = () => {
    const notes = Object.values(props.keymap);
    const keymapMin = notes.length ? Math.min(...notes) : MOBILE_MIN_NOTE;
    const baseNote = isMobile()
      ? Math.max(keymapMin, MOBILE_MIN_NOTE)
      : keymapMin;

    return {
      min:
        baseNote +
        props.octaveOffset * 12 +
        getRootNoteOffset(props.rootNote),
      keys: isMobile() ? MOBILE_KEY_COUNT : DESKTOP_KEY_COUNT,
    };
  };

  const handlePointer = (event: Event) => {
    const [noteState, displayedNote] = (event as PianoPointerEvent).note;
    const logicalNote = displayedNote - getRootNoteOffset(props.rootNote);

    if (noteState === 1) props.player?.play(logicalNote);
    else props.player?.release(logicalNote);
  };

  onMount(() => {
    const handleViewportChange = (event: MediaQueryListEvent) =>
      setIsMobile(event.matches);

    keyboard.addEventListener('pointer', handlePointer);
    mobileQuery.addEventListener('change', handleViewportChange);

    onCleanup(() => {
      keyboard.removeEventListener('pointer', handlePointer);
      mobileQuery.removeEventListener('change', handleViewportChange);
    });
  });

  createEffect(() => {
    const { min, keys } = getDisplayRange();
    keyboard.width = 300;
    keyboard.height = props.height ?? 60;
    keyboard.min = min;
    keyboard.keys = keys;
    displayedPressedNotes = new Set();
  });

  createEffect(() => {
    getDisplayRange();
    const rootOffset = getRootNoteOffset(props.rootNote);
    const nextNotes = new Set(
      [...props.pressedNotes].map((note) => note + rootOffset),
    );

    for (const note of displayedPressedNotes) {
      if (!nextNotes.has(note)) keyboard.setNote(0, note);
    }
    for (const note of nextNotes) {
      if (!displayedPressedNotes.has(note)) keyboard.setNote(1, note);
    }

    displayedPressedNotes = nextNotes;
  });

  return (
    <div
      id='piano-keyboard'
      class='piano-keyboard piano-keyboard-control'
      style={COMPONENT_STYLE}
    >
      <webaudio-keyboard ref={keyboard} />
    </div>
  );
};

export default PianoKeyboard;
