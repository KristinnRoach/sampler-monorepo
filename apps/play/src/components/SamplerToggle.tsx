import { createEffect, createSignal, type Component } from 'solid-js';
import {
  samplerToggles,
  type SamplerToggleKey,
  type SamplePlayer,
} from '@repo/audiolib';
import styles from './SamplerToggle.module.css';

interface SamplerToggleProps {
  param: SamplerToggleKey;
  player: SamplePlayer | null;
}

const SamplerToggle: Component<SamplerToggleProps> = (props) => {
  const descriptor = samplerToggles[props.param];
  const [enabled, setEnabled] = createSignal(descriptor.defaultValue);

  createEffect(() => {
    const player = props.player;
    if (player) descriptor.apply(player, enabled());
  });

  return (
    <label
      class={`${styles.toggle} ${enabled() ? styles.enabled : ''} ${props.player ? '' : styles.disabled}`}
      title={descriptor.label}
    >
      <input
        class={styles.input}
        type='checkbox'
        aria-label={descriptor.label}
        checked={enabled()}
        disabled={!props.player}
        onInput={(event) => setEnabled(event.currentTarget.checked)}
      />
      <span class={styles.container} aria-hidden='true'>
        <span class={styles.switch} />
      </span>
      <span class={styles.label}>{descriptor.format(enabled())}</span>
    </label>
  );
};

export default SamplerToggle;
