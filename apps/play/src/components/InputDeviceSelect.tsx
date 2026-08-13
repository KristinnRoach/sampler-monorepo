// components/InputDeviceSelect.tsx
import {
  Component,
  For,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import { getAudioInputDevices } from '@repo/audiolib';

interface InputDeviceSelectProps {
  class?: string;
  disabled?: boolean;
  value: string;
  onChange: (deviceId: string) => void;
}

/** Chooses the audio input device used for future sampler recordings. Controlled component - device id lives in the parent so multiple instances stay in sync. */
const InputDeviceSelect: Component<InputDeviceSelectProps> = (props) => {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);

  const refresh = async () => setDevices(await getAudioInputDevices());

  const refreshWithPermission = async () => {
    await refresh();
    const gated = devices().every((d) => !d.label);
    if (!gated) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      await refresh();
    } catch {
      // permission denied - keep the unlabeled list
    }
  };

  onMount(() => {
    refresh();
    navigator.mediaDevices.addEventListener('devicechange', refresh);
    onCleanup(() =>
      navigator.mediaDevices.removeEventListener('devicechange', refresh),
    );
  });

  const selectedLabel = createMemo(() => {
    if (!props.value) return 'System Default Input';
    return (
      devices().find((d) => d.deviceId === props.value)?.label ||
      'Audio input device'
    );
  });

  const onChange = (deviceId: string) =>
    props.onChange(deviceId === 'default' ? '' : deviceId);

  return (
    <div class={props.class}>
      <select
        aria-label='Audio input device'
        title={selectedLabel()}
        class='icon-select'
        value={props.value}
        disabled={props.disabled}
        onfocus={refreshWithPermission}
        onchange={(e) => onChange(e.currentTarget.value)}
      >
        <option value='' selected={!props.value}>
          System Default Input
        </option>
        <For each={devices().filter((d) => d.deviceId !== 'default')}>
          {(d, i) => (
            <option value={d.deviceId} selected={props.value === d.deviceId}>
              {d.label || `Input ${i() + 1}`}
            </option>
          )}
        </For>
      </select>
      <div class='icon-select-icon'>
        <svg
          aria-hidden='true'
          viewBox='0 0 24 24'
          width='20'
          height='20'
          fill='none'
          stroke='currentColor'
          stroke-width='2'
          stroke-linecap='round'
          stroke-linejoin='round'
        >
          <path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z' />
          <path d='M19 10v2a7 7 0 0 1-14 0v-2' />
          <path d='M12 19v3' />
        </svg>
      </div>
    </div>
  );
};

export default InputDeviceSelect;
