import type {
  SamplePlayer,
  SupportedWaveform,
} from '@repo/audiolib';
import {
  restoreSamplerParamValues,
  snapshotSamplerParamValues,
  type SamplerParamValues,
} from './samplerParamState';

export interface EnvelopeSettings {
  points: Array<{ time: number; value: number; curve?: string }>;
  sustainPointIndex?: number | null;
  releasePointIndex?: number;
  isEnabled: boolean;
  loopEnabled: boolean;
  syncedToPlaybackRate: boolean;
  timeScale?: number;
}

export interface InstrumentSettings {
  // Optional: rows read back from IndexedDB aren't guaranteed to match this shape.
  params?: SamplerParamValues;
  toggles?: Record<string, string>;
  envelopes?: Record<string, EnvelopeSettings>;
  selects?: Record<string, string>;
}

const envelopeTypes = ['amp-env', 'filter-env', 'pitch-env'] as const;

export function captureInstrumentState(
  player: SamplePlayer,
  controlsRoot: ParentNode,
): InstrumentSettings {
  const envelopes: Record<string, EnvelopeSettings> = {};

  if (player.initialized) {
    envelopeTypes.forEach((envType) => {
      try {
        const envelope = player.getEnvelope(envType);
        envelopes[envType] = {
          points: envelope.points.map((point) => ({
            time: point.time,
            value: point.value,
            curve: point.curve || 'linear',
          })),
          sustainPointIndex: envelope.sustainPointIndex ?? null,
          releasePointIndex: envelope.releasePointIndex,
          isEnabled: envelope.isEnabled,
          loopEnabled: envelope.loopEnabled,
          syncedToPlaybackRate: envelope.syncedToPlaybackRate,
          timeScale: envelope.timeScale || 1,
        };
      } catch (error) {
        console.warn(`Could not capture envelope ${envType}:`, error);
      }
    });
  }

  return {
    params: snapshotSamplerParamValues(),
    toggles: captureToggles(controlsRoot),
    envelopes,
    selects: captureSelects(controlsRoot),
  };
}

export function restoreInstrumentState(
  player: SamplePlayer,
  controlsRoot: ParentNode,
  settings: InstrumentSettings,
): void {
  restoreSamplerParamValues(settings.params ?? {});
  restoreToggles(player, controlsRoot, settings.toggles ?? {});
  restoreSelects(player, controlsRoot, settings.selects ?? {});

  const envelopeSwitcher = controlsRoot.querySelector('envelope-switcher') as
    | (HTMLElement & {
        restoreEnvelopeSettings?: (
          settings: Record<string, EnvelopeSettings>,
        ) => void;
      })
    | null;
  envelopeSwitcher?.restoreEnvelopeSettings?.(settings.envelopes ?? {});
}

function captureToggles(
  controlsRoot: ParentNode,
): Record<string, string> {
  const toggles: Record<string, string> = {};
  const svgToggleNames = [
    'playback-direction-toggle',
    'loop-lock-toggle',
    'hold-lock-toggle',
    'pitch-toggle',
  ];
  svgToggleNames.forEach((name) => {
    const button = controlsRoot.querySelector(`${name} button.svg-button`) as
      | (HTMLButtonElement & { getState?: () => string })
      | null;
    const value = button?.getState?.();
    if (value !== undefined) toggles[name] = value;
  });

  return toggles;
}

function restoreToggles(
  player: SamplePlayer,
  controlsRoot: ParentNode,
  toggles: Record<string, string>,
): void {
  Object.entries(toggles).forEach(([name, value]) => {
    const button = controlsRoot.querySelector(`${name} button.svg-button`) as
      | (HTMLButtonElement & { setState?: (value: string) => void })
      | null;
    button?.setState?.(value);

    switch (name) {
      case 'playback-direction-toggle':
        player.setPlaybackDirection(
          value === 'direction_reverse' ? 'reverse' : 'forward',
        );
        break;
      case 'loop-lock-toggle':
        player.setLoopLocked(value === 'loop_locked');
        break;
      case 'hold-lock-toggle':
        player.setHoldLocked(value === 'hold_locked');
        break;
      case 'pitch-toggle':
        if (value === 'pitch_on') player.enablePitch();
        else player.disablePitch();
        break;
    }
  });
}

function captureSelects(controlsRoot: ParentNode): Record<string, string> {
  const selects: Record<string, string> = {};

  [
    { name: 'rootnote-select', selector: 'rootnote-select select' },
    { name: 'keymap-select', selector: '.keymap-select select' },
    { name: 'waveform-select', selector: 'waveform-select select' },
  ].forEach(({ name, selector }) => {
    const select = controlsRoot.querySelector(selector) as HTMLSelectElement | null;
    if (select) selects[name] = select.value;
  });

  return selects;
}

function restoreSelects(
  player: SamplePlayer,
  controlsRoot: ParentNode,
  selects: Record<string, string>,
): void {
  Object.entries(selects).forEach(([name, value]) => {
    const selector =
      name === 'keymap-select' ? '.keymap-select select' : `${name} select`;
    const select = controlsRoot.querySelector(selector) as HTMLSelectElement | null;
    if (!select) return;

    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));

    if (name === 'waveform-select') {
      player.setModulationWaveform('AM', value as SupportedWaveform);
    } else if (name === 'rootnote-select') {
      player.setRootNote(value as Parameters<SamplePlayer['setRootNote']>[0]);
    }
  });
}
