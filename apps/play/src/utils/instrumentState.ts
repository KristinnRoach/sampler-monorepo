import type {
  SamplerParamKey,
  SamplePlayer,
  SupportedWaveform,
} from '@repo/audiolib';
import {
  restoreSamplerParamValues,
  snapshotSamplerParamValues,
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
  params?: Partial<Record<SamplerParamKey, number>>;
  /** Legacy saved-instrument format, read for compatibility only. */
  knobs?: Record<string, number>;
  toggles?: Record<string, boolean | string>;
  envelopes?: Record<string, EnvelopeSettings>;
  selects?: Record<string, string>;
  /** Legacy tempo field, now represented by params.tempo. */
  tempo?: number;
}

const legacyParamKeys: Record<string, SamplerParamKey> = {
  'volume-knob': 'volume',
  'dry-wet-knob': 'dryWet',
  'reverb-send-knob': 'reverbSend',
  'reverb-size-knob': 'reverbSize',
  'delay-send-knob': 'delaySend',
  'delay-time-knob': 'delayTime',
  'delay-feedback-knob': 'delayFeedback',
  'highpass-filter-knob': 'highpassFilter',
  'lowpass-filter-knob': 'lowpassFilter',
  'distortion-knob': 'distortion',
  'am-modulation': 'amMod',
  'loop-start-knob': 'loopStart',
  'loop-duration-knob': 'loopDuration',
  'loop-duration-drift-knob': 'loopDurationDrift',
  'trim-start-knob': 'trimStart',
  'trim-end-knob': 'trimEnd',
  'feedback-knob': 'feedback',
  'feedback-pitch-knob': 'feedbackPitch',
  'feedback-lpf-knob': 'feedbackLpf',
  'feedback-decay-knob': 'feedbackDecay',
  'gain-lfo-rate-knob': 'gainLFORate',
  'gain-lfo-depth-knob': 'gainLFODepth',
  'pitch-lfo-rate-knob': 'pitchLFORate',
  'pitch-lfo-depth-knob': 'pitchLFODepth',
  'glide-knob': 'glide',
  'tempo-knob': 'tempo',
};

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
  const params: Partial<Record<SamplerParamKey, number>> = {
    ...settings.params,
  };

  Object.entries(settings.knobs ?? {}).forEach(([legacyKey, value]) => {
    const key = legacyParamKeys[legacyKey];
    if (key && params[key] === undefined) params[key] = value;
  });
  if (settings.tempo !== undefined && params.tempo === undefined) {
    params.tempo = settings.tempo;
  }

  restoreSamplerParamValues(params);
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
): Record<string, boolean | string> {
  const toggles: Record<string, boolean | string> = {};
  const svgToggleNames = [
    'playback-direction-toggle',
    'loop-lock-toggle',
    'hold-lock-toggle',
    'pitch-toggle',
  ];
  const booleanToggleNames = [
    'pan-drift-toggle',
    'feedback-mode-toggle',
    'gain-lfo-sync-toggle',
    'pitch-lfo-sync-toggle',
  ];

  svgToggleNames.forEach((name) => {
    const button = controlsRoot.querySelector(`${name} button.svg-button`) as
      | (HTMLButtonElement & { getState?: () => string })
      | null;
    const value = button?.getState?.();
    if (value !== undefined) toggles[name] = value;
  });

  booleanToggleNames.forEach((name) => {
    const control = controlsRoot.querySelector(name) as
      | (HTMLElement & { getValue?: () => boolean })
      | null;
    const value = control?.getValue?.();
    if (value !== undefined) toggles[name] = value;
  });

  return toggles;
}

function restoreToggles(
  player: SamplePlayer,
  controlsRoot: ParentNode,
  toggles: Record<string, boolean | string>,
): void {
  Object.entries(toggles).forEach(([name, value]) => {
    if (typeof value === 'boolean') {
      const control = controlsRoot.querySelector(name) as
        | (HTMLElement & { setValue?: (value: boolean) => void })
        | null;
      control?.setValue?.(value);
      return;
    }

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

  ['rootnote-select', 'keymap-select', 'waveform-select'].forEach((name) => {
    const select = controlsRoot.querySelector(
      `${name} select`,
    ) as HTMLSelectElement | null;
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
    const select = controlsRoot.querySelector(
      `${name} select`,
    ) as HTMLSelectElement | null;
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
