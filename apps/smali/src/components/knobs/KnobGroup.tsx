import { Component, createSignal, For, JSX, type Accessor } from 'solid-js';
import { KnobComponent } from '@repo/audio-components/solidjs';
import type {
  KnobPresetKey,
  KnobPresetProps,
  KnobChangeEventDetail,
  KnobComponentProps,
} from '@repo/audio-components/solidjs';
import { SamplePlayer } from '@repo/audiolib';

export interface KnobGroupProps {
  knobPresets: Array<KnobPresetKey>;
  instruments: Accessor<Record<string, SamplePlayer>>; // getter function

  groupClass?: string;
  knobClass?: string;

  title?: string;
  groupLabel?: string;
}

const KnobGroup: Component<KnobGroupProps> = (props) => {
  const connectedInstruments = () => props.instruments();

  // Create onChange handler based on preset
  const createOnChangeHandler = (preset: KnobPresetKey) => {
    return (detail: KnobChangeEventDetail) => {
      const instruments = connectedInstruments();

      // Apply the change to all connected instruments
      Object.values(instruments).forEach((samplePlayer) => {
        switch (preset) {
          case 'volume':
            samplePlayer.setVolume(detail.value);
            break;
          case 'dryWet':
            samplePlayer.setDryWetMix({
              dry: 1 - detail.value,
              wet: detail.value,
            });
            break;
          case 'feedback':
            samplePlayer.setFeedbackAmount(detail.value);
            break;
          case 'glide':
            samplePlayer.setGlideTime(detail.value);
            break;
          case 'feedbackPitch':
            samplePlayer.setFeedbackPitchScale(detail.value);
            break;
          case 'feedbackDecay':
            samplePlayer.setFeedbackDecay(detail.value);
            break;
          case 'feedbackLpf':
            samplePlayer.setFeedbackLowpassCutoff(detail.value);
            break;
          case 'gainLFORate':
            samplePlayer.gainLFO?.setFrequency(detail.value);
            break;
          case 'gainLFODepth':
            samplePlayer.gainLFO?.setDepth(detail.value);
            break;
          case 'pitchLFORate':
            samplePlayer.pitchLFO?.setFrequency(detail.value);
            break;
          case 'pitchLFODepth':
            samplePlayer.pitchLFO?.setDepth(detail.value);
            break;
          case 'reverbSize':
            samplePlayer.setReverbAmount(detail.value);
            break;
          case 'loopDurationDrift':
            samplePlayer.setLoopDurationDriftAmount(detail.value);
            break;
          case 'lowpassFilter':
            samplePlayer.setLpfCutoff(detail.value);
            break;
          case 'highpassFilter':
            samplePlayer.setHpfCutoff(detail.value);
            break;
          case 'amplitudeMod':
            samplePlayer.setModulationAmount('AM', detail.value);
            break;
          case 'trimStart':
            samplePlayer.setSampleStartPoint(detail.value);
            break;
          case 'trimEnd':
            samplePlayer.setSampleEndPoint(detail.value);
            break;
          case 'loopStart':
            samplePlayer.setLoopStart(detail.value);
            break;
          case 'loopDuration':
            samplePlayer.setLoopDuration(detail.value);
            break;
          case 'tempo':
            samplePlayer.setTempo(detail.value);
            break;
          case 'distortion':
            samplePlayer.outputBus.setDistortionMacro(detail.value);
            break;
          case 'drive':
            samplePlayer.outputBus.setDrive(detail.value);
            break;
          case 'clipping':
            samplePlayer.outputBus.setClippingMacro(detail.value);
            break;
          case 'delayTime':
            samplePlayer.outputBus.setDelayTime(detail.value);
            break;
          case 'delayFeedback':
            samplePlayer.outputBus.setDelayFeedback(detail.value);
            break;
          case 'delaySend':
            samplePlayer.sendToFx('delay', detail.value);
            break;
          case 'reverbSend':
            samplePlayer.sendToFx('reverb', detail.value);
            break;
          default:
            console.warn(`Unknown preset: ${preset}`);
        }
      });
    };
  };

  return (
    <div
      style={
        'display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 2rem;'
      }
      class={props.groupClass || 'knob-group'}
      title={props.title}
    >
      {props.groupLabel && (
        <h3
          class={'knob-group-label'}
          style='width: 100%; margin-bottom: 12px;'
        >
          {props.groupLabel}
        </h3>
      )}
      <For each={props.knobPresets}>
        {(preset) => (
          <KnobComponent
            preset={preset}
            onChange={createOnChangeHandler(preset)}
            class={props.knobClass || 'knob'}
            width={80}
          />
        )}
      </For>
    </div>
  );
};

export default KnobGroup;
