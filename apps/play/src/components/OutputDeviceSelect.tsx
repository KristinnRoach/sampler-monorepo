// components/OutputDeviceSelect.tsx
import { Component, For, Show, createSignal, onCleanup, onMount } from 'solid-js';
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
  const [selected, setSelected] = createSignal(getCurrentOutputDeviceId());

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
      navigator.mediaDevices.removeEventListener('devicechange', refresh)
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
      <select
        title='Audio output device'
        class={props.class}
        value={selected()}
        onfocus={refreshWithPermission}
        onchange={(e) => onChange(e.currentTarget.value)}
      >
        <option value=''>System Default Output</option>
        <For each={devices().filter((d) => d.deviceId !== 'default')}>
          {(d, i) => (
            <option value={d.deviceId}>{d.label || `Output ${i() + 1}`}</option>
          )}
        </For>
      </select>
    </Show>
  );
};

export default OutputDeviceSelect;
