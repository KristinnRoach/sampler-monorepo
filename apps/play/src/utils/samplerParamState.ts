import { createSignal } from 'solid-js';
import { samplerParams, type SamplerParamKey } from '@repo/audiolib';

export type SamplerParamValues = Record<SamplerParamKey, number>;

const DEFAULT_NODE_ID = 'test-sampler';

const defaultValues = Object.fromEntries(
  Object.entries(samplerParams).map(([key, descriptor]) => [
    key,
    descriptor.defaultValue,
  ]),
) as SamplerParamValues;

const storageKey = (key: SamplerParamKey) =>
  `${samplerParams[key].label}:nodeId:${DEFAULT_NODE_ID}`;

const loadValues = (): SamplerParamValues => {
  const values = { ...defaultValues };

  try {
    (Object.keys(samplerParams) as SamplerParamKey[]).forEach((key) => {
      const stored = localStorage.getItem(storageKey(key));
      if (stored === null) return;

      const parsed = Number(stored);
      if (Number.isFinite(parsed)) values[key] = parsed;
    });
  } catch {
    // Storage may be unavailable; descriptor defaults remain authoritative.
  }

  return values;
};

export const [samplerParamValues, setSamplerParamValues] =
  createSignal<SamplerParamValues>(loadValues());

const saveTimers = new Map<SamplerParamKey, ReturnType<typeof setTimeout>>();

const persistValue = (key: SamplerParamKey, value: number): void => {
  clearTimeout(saveTimers.get(key));
  saveTimers.set(
    key,
    setTimeout(() => {
      try {
        localStorage.setItem(storageKey(key), String(value));
      } catch {
        // Persistence is optional; the live app state still updates.
      }
      saveTimers.delete(key);
    }, 200),
  );
};

export const setSamplerParamValue = (
  key: SamplerParamKey,
  value: number,
): void => {
  if (!Number.isFinite(value)) return;

  setSamplerParamValues((current) =>
    current[key] === value ? current : { ...current, [key]: value },
  );

  persistValue(key, value);
};

export const snapshotSamplerParamValues = (): SamplerParamValues => ({
  ...samplerParamValues(),
});

export const restoreSamplerParamValues = (
  values: Partial<Record<SamplerParamKey, number>>,
): void => {
  (Object.keys(values) as SamplerParamKey[]).forEach((key) => {
    if (key in samplerParams) setSamplerParamValue(key, values[key]!);
  });
};
