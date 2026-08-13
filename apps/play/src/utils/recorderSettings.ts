import { createSignal } from "solid-js";

export type RecorderInputSource = "audio-input" | "browser" | "resample";

export const [recorderInputSource, setRecorderInputSource] =
  createSignal<RecorderInputSource>("audio-input");

export const [recorderInputDeviceId, setRecorderInputDeviceId] = createSignal("");

export const getRecorderSettings = () => ({
  inputSource: recorderInputSource(),
  inputDeviceId: recorderInputDeviceId(),
});
