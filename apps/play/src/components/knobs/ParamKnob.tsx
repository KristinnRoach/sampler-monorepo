// Generic Solid knob for any SamplePlayer parameter, driven by audiolib's
// samplerParams descriptors. Replaces the per-param web components
// (volume-knob, feedback-knob, ...) from audio-components.
import { Component, createEffect, createSignal, onCleanup, onMount } from "solid-js";

import {
  samplerParams,
  type SamplerParamKey,
  type SamplerParamDescriptor,
  type SamplePlayer,
} from "@repo/audiolib";
import { KnobElement, registerKnobElement } from "@repo/audiolib/components";

import { samplerParamValues, setSamplerParamValue } from "../../utils/samplerParamState";

import styles from "./ParamKnob.module.css";

interface ParamKnobProps {
  param: SamplerParamKey;
  player: SamplePlayer | null;
  label?: string;
  size?: number;
  class?: string;
  minAllowed?: () => number;
  maxAllowed?: () => number;
}

export const ParamKnob: Component<ParamKnobProps> = (props) => {
  const desc: SamplerParamDescriptor = samplerParams[props.param];
  const [sampleDuration, setSampleDuration] = createSignal(0);
  const value = () => samplerParamValues()[props.param];

  let containerRef: HTMLDivElement | undefined;
  let knobEl: KnobElement | undefined;
  const handleChange = (e: Event) => {
    const requestedValue = (e as CustomEvent<{ value: number }>).detail.value;
    const minAllowed = Math.max(desc.min, props.minAllowed?.() ?? desc.min);
    const maxAllowed = Math.min(desc.max, props.maxAllowed?.() ?? desc.max);
    const clampedValue = Math.max(minAllowed, Math.min(requestedValue, maxAllowed));

    setSamplerParamValue(props.param, clampedValue);
    if (clampedValue !== requestedValue) knobEl?.setValue(clampedValue);
  };

  onMount(() => {
    const size = props.size ?? 45;
    // Appending KnobElement synchronously emits its descriptor default. Keep
    // the storage-backed shared value captured before that event updates state.
    const initialValue = value();
    registerKnobElement();
    knobEl = document.createElement("knob-element") as KnobElement;

    const attrs: Record<string, string> = {
      "min-value": String(desc.min),
      "max-value": String(desc.max),
      "default-value": String(desc.defaultValue),
      "snap-increment": String(desc.step ?? 0),
      curve: String(desc.curve ?? 1),
      width: String(size),
      height: String(size),
    };
    if (desc.allowedValues) {
      attrs["allowed-values"] = JSON.stringify(desc.allowedValues);
    }
    Object.entries(attrs).forEach(([k, v]) => knobEl!.setAttribute(k, v));

    knobEl.addEventListener("knob-change", handleChange);
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
      player.onMessage("sample:loaded", (msg: any) => setSampleDuration(msg.durationSeconds)),
    );

    onCleanup(() => unsubscribe.forEach((stop) => stop()));
  });

  onCleanup(() => {
    knobEl?.removeEventListener("knob-change", handleChange);
  });

  const label = () => props.label ?? desc.label;
  const format = desc.format ?? ((v: number, _duration: number) => v.toFixed(2));
  const readout = () => format(value(), sampleDuration());

  return (
    <div data-param={props.param} class={`${styles.knobContainer} ${props.class ?? ""}`}>
      <div class={styles.knobLabel}>{label()}</div>
      <div ref={containerRef} />
      <div class={styles.knobValue}>{readout()}</div>
    </div>
  );
};

export default ParamKnob;
