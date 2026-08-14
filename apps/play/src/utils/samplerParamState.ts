import { createStore } from 'solid-js/store';
import {
  samplerParams,
  type SamplerParamKey,
  type SamplerParamPatch,
  type SamplerParamValues,
} from '@kidlib/web-audio';

const DRAFT_STORAGE_KEY = 'play:working-param-draft:v1';

const defaultValues = Object.fromEntries(
  Object.entries(samplerParams).map(([key, descriptor]) => [
    key,
    descriptor.defaultValue,
  ]),
) as SamplerParamValues;

const loadDraft = (): SamplerParamValues => {
  const values = { ...defaultValues };
  try {
    const draft = JSON.parse(
      sessionStorage.getItem(DRAFT_STORAGE_KEY) ?? 'null',
    ) as SamplerParamPatch | null;
    if (draft) {
      Object.entries(draft).forEach(([key, value]) => {
        if (
          key in samplerParams &&
          typeof value === 'number' &&
          Number.isFinite(value)
        ) {
          values[key as SamplerParamKey] = value;
        }
      });
    }
  } catch {
    // Session persistence is best-effort; descriptor defaults remain valid.
  }
  return values;
};

const [paramValues, setParamValues] =
  createStore<SamplerParamValues>(loadDraft());

export const samplerParamValues = () => paramValues;

export const setSamplerParamValue = (
  key: SamplerParamKey,
  value: number,
): void => {
  if (!Number.isFinite(value) || paramValues[key] === value) return;

  setParamValues(key, value);
  try {
    sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(paramValues));
  } catch {
    // Live state remains usable when session storage is unavailable.
  }
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
