import { createStore } from 'solid-js/store';
import {
  samplerParams,
  type SamplerParamKey,
  type SamplerParamPatch,
  type SamplerParamValues,
} from '@repo/audiolib';

const defaultValues = Object.fromEntries(
  Object.entries(samplerParams).map(([key, descriptor]) => [
    key,
    descriptor.defaultValue,
  ]),
) as SamplerParamValues;

const [paramValues, setParamValues] =
  createStore<SamplerParamValues>(defaultValues);

export const samplerParamValues = () => paramValues;

export const setSamplerParamValue = (
  key: SamplerParamKey,
  value: number,
): void => {
  if (!Number.isFinite(value) || paramValues[key] === value) return;

  setParamValues(key, value);
};

export const snapshotSamplerParamValues = (): SamplerParamValues => ({
  ...samplerParamValues(),
});

export const restoreSamplerParamValues = (
  values: SamplerParamPatch,
): void => {
  (Object.keys(values) as SamplerParamKey[]).forEach((key) => {
    if (key in samplerParams) setSamplerParamValue(key, values[key]!);
  });
};
