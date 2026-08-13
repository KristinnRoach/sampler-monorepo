// components/OutputDeviceSelect.tsx
import {
  Component,
  For,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import {
  canSetOutputDevice,
  getAudioOutputDevices,
  setAudioOutputDevice,
  getCurrentOutputDeviceId,
} from '@repo/audiolib';

interface OutputDeviceSelectProps {
  class?: string;
}

/** Routes the app's audio output to a chosen device (e.g. BlackHole -> DAW).
 *  Hidden entirely on browsers without AudioContext.setSinkId (Safari). */
const OutputDeviceSelect: Component<OutputDeviceSelectProps> = (props) => {
  const [devices, setDevices] = createSignal<MediaDeviceInfo[]>([]);
  const [selected, setSelected] = createSignal('');

  const refresh = async () => setDevices(await getAudioOutputDevices());

  // Chrome only exposes the full labeled output list once mic permission is
  // granted, so request it on user interaction if the list looks gated.
  const refreshWithPermission = async () => {
    await refresh();
    const gated = devices().every((d) => !d.label);
    if (!gated) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      await refresh();
    } catch {
      // permission denied — keep the unlabeled list
    }
  };

  onMount(() => {
    if (!canSetOutputDevice()) return;
    refresh();
    navigator.mediaDevices.addEventListener('devicechange', refresh);
    onCleanup(() =>
      navigator.mediaDevices.removeEventListener('devicechange', refresh),
    );
  });

  const selectedLabel = createMemo(() => {
    if (!selected()) return 'System Default Output';
    return (
      devices().find((d) => d.deviceId === selected())?.label ||
      'Audio output device'
    );
  });

  const onChange = async (deviceId: string) => {
    try {
      await setAudioOutputDevice(deviceId);
      setSelected(deviceId);
    } catch (err) {
      console.error('Failed to set output device', err);
    }
  };

  return (
    <Show when={canSetOutputDevice()}>
      <div class={props.class}>
        <select
          aria-label='Audio output device'
          title={selectedLabel()}
          class='icon-select'
          value={selected()}
          onfocus={refreshWithPermission}
          onchange={(e) => onChange(e.currentTarget.value)}
        >
          <option value='' selected={!selected()}>System Default Output</option>
          <For each={devices().filter((d) => d.deviceId !== 'default')}>
            {(d, i) => (
              <option value={d.deviceId} selected={selected() === d.deviceId}>
                {d.label || `Output ${i() + 1}`}
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
            <path d='M11 5 6 9H3v6h3l5 4z' />
            <path d='M15.5 8.5a5 5 0 0 1 0 7' />
            <path d='M18.5 5.5a9 9 0 0 1 0 13' />
          </svg>
        </div>
      </div>
    </Show>
  );
};

export default OutputDeviceSelect;
