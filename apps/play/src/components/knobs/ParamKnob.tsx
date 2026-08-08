// Generic Solid knob for any SamplePlayer parameter, driven by audiolib's
// samplerParams descriptors. Replaces the per-param web components
// (volume-knob, feedback-knob, ...) from audio-components.
import {
  Component,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from 'solid-js';
import {
  defineElement,
  KnobElement,
  samplerParams,
  type SamplerParamKey,
  type SamplerParamDescriptor,
  type SamplePlayer,
} from '@repo/audiolib';
import {
  samplerParamValues,
  setSamplerParamValue,
} from '../../utils/samplerParamState';
import styles from './ParamKnob.module.css';

interface ParamKnobProps {
  param: SamplerParamKey;
  player: SamplePlayer | null;
  label?: string;
  size?: number;
  class?: string;
  title?: string;
}

export const ParamKnob: Component<ParamKnobProps> = (props) => {
  const desc: SamplerParamDescriptor = samplerParams[props.param];
  const [dimmed, setDimmed] = createSignal(false);
  const [sampleDuration, setSampleDuration] = createSignal(0);
  const value = () => samplerParamValues()[props.param];

  let containerRef: HTMLDivElement | undefined;
  let knobEl: KnobElement | undefined;
  const handleChange = (e: Event) => {
    let val = (e as CustomEvent<{ value: number }>).detail.value;
    const values = samplerParamValues();
    const gap = desc.step ?? 0;

    if (props.param === 'loopStart') {
      val = Math.max(desc.min, Math.min(val, values.loopEnd - gap));
    }
    if (props.param === 'loopEnd') {
      val = Math.min(desc.max, Math.max(val, values.loopStart + gap));
    }

    setSamplerParamValue(props.param, val);
  };

  onMount(() => {
    const size = props.size ?? 45;
    // Appending KnobElement synchronously emits its descriptor default. Keep
    // the storage-backed shared value captured before that event updates state.
    const initialValue = value();
    defineElement('knob-element', KnobElement);
    knobEl = document.createElement('knob-element') as KnobElement;

    const attrs: Record<string, string> = {
      'min-value': String(desc.min),
      'max-value': String(desc.max),
      'default-value': String(desc.defaultValue),
      'snap-increment': String(desc.step ?? 0),
      curve: String(desc.curve ?? 1),
      width: String(size),
      height: String(size),
    };
    if (desc.allowedValues) {
      attrs['allowed-values'] = JSON.stringify(desc.allowedValues);
    }
    Object.entries(attrs).forEach(([k, v]) => knobEl!.setAttribute(k, v));

    knobEl.addEventListener('knob-change', handleChange);
    containerRef!.appendChild(knobEl);
    knobEl.setValue(initialValue);
  });

  // Keep the player and visible knob in sync with Play's parameter state.
  createEffect(() => {
    const nextValue = value();
    if (knobEl?.getValue() !== nextValue) knobEl?.setValue(nextValue);

    const player = props.player;
    if (!player) return;

    desc.apply(player, nextValue);
  });

  // On player ready, track the loaded sample's duration for the seconds
  // readout of normalized params. These listeners must not be recreated when
  // the knob value changes.
  createEffect(() => {
    const player = props.player;
    if (!player) return;

    const unsubscribe: Array<() => void> = [];

    setSampleDuration(player.sampleDuration);
    unsubscribe.push(
      player.onMessage('sample:loaded', (msg: any) =>
        setSampleDuration(msg.durationSeconds),
      ),
    );

    // Keytrack has no audible effect when the loop is off or audio-rate
    // (<= PITCH_PRESERVATION_THRESHOLD in the processor): dim as a hint.
    // The message keeps this hint reactive when either loop target changes.
    if (props.param === 'keytrackLoop') {
      const AUDIO_RATE_SECONDS = 0.061;
      const updateHint = (msg?: { loopStart: number; loopEnd: number }) => {
        const loopStart = msg ? msg.loopStart : player.loopStart;
        const loopEnd = msg ? msg.loopEnd : player.loopEnd;
        setDimmed(
          !player.loopEnabled || loopEnd - loopStart <= AUDIO_RATE_SECONDS,
        );
      };
      updateHint();
      unsubscribe.push(
        player.onMessage('loop-points:updated', (msg: any) => updateHint(msg)),
        player.onMessage('loop:enabled', () => updateHint()),
        player.onMessage('sample:loaded', () => updateHint()),
      );
    }

    onCleanup(() => unsubscribe.forEach((stop) => stop()));
  });

  onCleanup(() => {
    knobEl?.removeEventListener('knob-change', handleChange);
  });

  const label = () => props.label ?? desc.label;
  const format =
    desc.format ?? ((v: number, _duration: number) => v.toFixed(2));
  const readout = () => format(value(), sampleDuration());

  return (
    <div
      data-param={props.param}
      class={`${styles.knobContainer} ${props.class ?? ''}`}
      title={props.title}
      style={{ opacity: dimmed() ? '0.4' : '' }}
    >
      <div class={styles.knobLabel}>{label()}</div>
      <div ref={containerRef} />
      <div class={styles.knobValue}>{readout()}</div>
    </div>
  );
};

export default ParamKnob;
