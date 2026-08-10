import { For } from 'solid-js';

export const ROOT_NOTES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

export type RootNote = (typeof ROOT_NOTES)[number];

type RootNoteSelectProps = {
  value: RootNote;
  onChange: (value: RootNote) => void;
};

const RootNoteSelect = (props: RootNoteSelectProps) => (
  <div class='ac-selectContainer rootnote-select'>
    <select
      aria-label='Scale root note'
      title='Select Scale Root Note'
      class='ac-select'
      value={props.value}
      onchange={(event) =>
        props.onChange(event.currentTarget.value as RootNote)
      }
    >
      <For each={ROOT_NOTES}>
        {(note) => <option value={note}>{note}</option>}
      </For>
    </select>
  </div>
);

export default RootNoteSelect;
