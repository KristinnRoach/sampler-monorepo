// Generic Solid knob for any SamplePlayer parameter, driven by audiolib's
// samplerParams descriptors. Replaces the per-param web components
// (volume-knob, feedback-knob, ...) from audio-components.
//
// Uses the knob-element primitive from audio-components' main entry directly;
// the /solidjs entry can't be imported alongside it (both define
// oscilloscope-element unguarded, which throws on double registration).
import { Component, createEffect, createSignal, onCleanup, onMount } from 'solid-js';
import type { KnobElement } from '@repo/audio-components';
import {
  samplerParams,
  type SamplerParamKey,
  type SamplerParamDescriptor,
  type SamplePlayer,
} from '@repo/audiolib';

interface ParamKnobProps {
  param: SamplerParamKey;
  player: SamplePlayer | null;
  /** Part of the localStorage key; matches the old web-component format */
  nodeId?: string;
  label?: string;
  size?: number;
  class?: string;
  title?: string;
}

const DEFAULT_NODE_ID = 'test-sampler';

export const ParamKnob: Component<ParamKnobProps> = (props) => {
  const desc: SamplerParamDescriptor = samplerParams[props.param];

  // Same key format as audio-components' createKnobForTarget, so previously
  // stored values carry over.
  const storageKey = `${desc.label}:nodeId:${props.nodeId ?? DEFAULT_NODE_ID}`;

  const storedValue = () => {
    const stored = localStorage.getItem(storageKey);
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  const initialValue = storedValue() ?? desc.defaultValue;
  const [value, setValue] = createSignal(initialValue);
  const [dimmed, setDimmed] = createSignal(false);

  let containerRef: HTMLDivElement | undefined;
  let knobEl: KnobElement | undefined;
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const handleChange = (e: Event) => {
    const val = (e as CustomEvent<{ value: number }>).detail.value;
    setValue(val);
    if (props.player) desc.apply(props.player, val);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, String(val));
      } catch {
        /* ignore quota/unavailable */
      }
    }, 200);
  };

  onMount(() => {
    const size = props.size ?? 45;
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

  // Keep the player parameter in sync with the knob value.
  createEffect(() => {
    const player = props.player;
    if (!player) return;

    desc.apply(player, value());
  });

  // On player ready, wire up dynamic max (sample-length-relative params) to
  // follow the loaded sample. These listeners must not be recreated when the
  // knob value changes.
  createEffect(() => {
    const player = props.player;
    if (!player) return;

    const unsubscribe: Array<() => void> = [];

    if (desc.getMax) {
      const updateMax = (durationSeconds: number) => {
        if (!knobEl || durationSeconds <= 0) return;
        knobEl.setAttribute('max-value', durationSeconds.toString());
        // Params whose default means "full sample length" (trimEnd,
        // loopDuration) also track the duration as their default.
        if (desc.defaultValue === desc.max) {
          knobEl.setAttribute('default-value', durationSeconds.toString());
        }
      };

      updateMax(desc.getMax(player));
      unsubscribe.push(
        player.onMessage('sample:loaded', (msg: any) =>
          updateMax(msg.durationSeconds),
        ),
      );
    }

    // Keytrack has no audible effect when the loop is off or audio-rate
    // (<= PITCH_PRESERVATION_THRESHOLD in the processor): dim as a hint.
    // The loopStart/loopEnd getters lag (macro ramps async), so prefer the
    // message payload's target values when present.
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
    clearTimeout(saveTimer);
    knobEl?.removeEventListener('knob-change', handleChange);
  });

  const label = () => props.label ?? desc.label;
  const format = desc.format ?? ((v: number) => v.toFixed(2));

  return (
    <div
      data-param={props.param}
      class={`knob-container ${props.class ?? ''}`}
      title={props.title}
      style={{ opacity: dimmed() ? '0.4' : '' }}
    >
      <div class='knob-label' style='text-align: center; margin-bottom: 4px;'>
        {label()}
      </div>
      <div ref={containerRef} />
      <div
        class='knob-value'
        style='font-size: 10px; text-align: center; color: #999; margin-top: 4px;'
      >
        {format(value())}
      </div>
    </div>
  );
};

export default ParamKnob;
