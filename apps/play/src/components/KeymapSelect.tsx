import { For } from 'solid-js';
import type { KeymapKey } from '@kidlib/web-audio';

type KeymapSelectProps = {
  value: KeymapKey;
  onChange: (value: KeymapKey) => void;
};

const OPTIONS: { value: KeymapKey; label: string }[] = [
  { value: 'piano', label: 'Piano' },
  { value: 'major', label: 'Major' },
  { value: 'minor', label: 'Minor' },
  { value: 'pentatonic', label: 'Pentatonic' },
  { value: 'chromatic', label: 'Chromatic' },
];

const KeymapSelect = (props: KeymapSelectProps) => (
  <div class='ac-selectContainer keymap-select'>
    <select
      aria-label='Keyboard keymap'
      title='Select Keyboard Keymap'
      class='ac-select'
      value={props.value}
      onchange={(event) =>
        props.onChange(event.currentTarget.value as KeymapKey)
      }
    >
      <For each={OPTIONS}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  </div>
);

export default KeymapSelect;
