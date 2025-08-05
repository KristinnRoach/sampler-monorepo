// RecordButton.ts
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { createAudioRecorder, type Recorder } from '@repo/audiolib';
import { getSampler, onRegistryChange } from '../SamplerRegistry';
import {
  COMPONENT_STYLE,
  BUTTON_STYLE,
  BUTTON_ACTIVE_STYLE,
  RECORD_BUTTON_RECORDING_STYLE,
  RECORD_BUTTON_ARMED_STYLE,
} from '../../../shared/styles/component-styles';

const { div, button } = van.tags;

export const RecordButton = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const status = van.state('Ready');

  // Simple reactive approach: track the recorder and its state separately
  const currentRecorder: State<Recorder | null> = van.state(null);
  const recordBtnState: State<'Record' | 'Armed' | 'Recording'> =
    van.state('Record');
  const samplerAvailable = van.state(false);

  const startRecording = async () => {
    const sampler = getSampler(targetNodeId.val);
    if (!sampler || recordBtnState.val === 'Recording') return;

    try {
      // Create a new recorder for each recording session
      const recorderResult = await createAudioRecorder(sampler.context);

      if (!recorderResult) {
        status.val = 'Failed to create recorder';
        return;
      }

      currentRecorder.val = recorderResult;
      currentRecorder.val.connect(sampler);

      // Listen for state changes and update button state directly
      currentRecorder.val.onMessage('state-change', (msg: any) => {
        status.val = msg.state;

        // Directly map recorder state to button state
        switch (msg.state) {
          case 'ARMED':
            recordBtnState.val = 'Armed';
            break;
          case 'RECORDING':
            recordBtnState.val = 'Recording';
            break;
          case 'IDLE':
          case 'STOPPED':
          default:
            recordBtnState.val = 'Record';
            break;
        }
      });

      // Start recording
      await currentRecorder.val.start({
        useThreshold: true,
        startThreshold: -30,
        autoStop: true,
        stopThreshold: -40,
        silenceTimeoutMs: 1000,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      status.val = `Recording error: ${error instanceof Error ? error.message : String(error)}`;
      currentRecorder.val = null;
      recordBtnState.val = 'Record';
    }
  };

  const stopRecording = async () => {
    if (!currentRecorder.val) return;

    try {
      await currentRecorder.val.stop();
      currentRecorder.val.dispose();
      currentRecorder.val = null;
      recordBtnState.val = 'Record';
      status.val = 'Recording stopped';
    } catch (error) {
      currentRecorder.val = null;
      recordBtnState.val = 'Record';
      console.error('Failed to stop recording:', error);
      status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const handleClick = async () => {
    if (recordBtnState.val === 'Record') {
      await startRecording();
    } else if (recordBtnState.val === 'Armed') {
      // Force recording to start immediately when armed
      if (currentRecorder.val) {
        currentRecorder.val.forceStart();
      }
    } else {
      await stopRecording();
    }
  };

  const getButtonText = () => {
    switch (recordBtnState.val) {
      case 'Armed':
        return 'Armed';
      case 'Recording':
        return 'Recording';
      default:
        return 'Record';
    }
  };

  const getButtonStyle = () => {
    const baseStyle = BUTTON_STYLE;
    if (recordBtnState.val === 'Recording') {
      return `${baseStyle} ${BUTTON_ACTIVE_STYLE} ${RECORD_BUTTON_RECORDING_STYLE}`;
    } else if (recordBtnState.val === 'Armed') {
      return `${baseStyle} ${BUTTON_ACTIVE_STYLE} ${RECORD_BUTTON_ARMED_STYLE}`;
    }
    return baseStyle;
  };

  attributes.mount(() => {
    const checkSampler = () =>
      (samplerAvailable.val = !!getSampler(targetNodeId.val));

    const cleanupSamplerCheck = onRegistryChange(checkSampler);

    return () => {
      if (currentRecorder.val) {
        currentRecorder.val.stop();
        currentRecorder.val.dispose();
        currentRecorder.val = null;
        recordBtnState.val = 'Record';
      }
      cleanupSamplerCheck();
    };
  });

  return div(
    { class: 'record-button-control', style: COMPONENT_STYLE },
    button(
      {
        onclick: handleClick,
        style: () => getButtonStyle(),
        disabled: () => !samplerAvailable.val,
      },
      getButtonText
    ),
    div(() => status.val)
  );
};
