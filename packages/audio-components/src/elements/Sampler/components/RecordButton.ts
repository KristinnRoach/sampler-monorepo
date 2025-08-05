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
  const recordBtnState: State<'Record' | 'Armed' | 'Recording'> =
    van.state('Record');
  const status = van.state('Ready');

  let currentRecorder: Recorder | null = null;
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

      currentRecorder = recorderResult;
      currentRecorder.connect(sampler);

      // Event listeners (must be set up before calling recorder.start)
      currentRecorder.onMessage('state-change', (msg: any) => {
        // Map Recorder states to button states
        console.log('Received state-change:', msg);
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

        status.val = msg.state;
      });

      // Start recording
      await currentRecorder.start({
        useThreshold: true,
        startThreshold: -30,
        autoStop: true,
        stopThreshold: -40,
        silenceTimeoutMs: 1000,
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      status.val = `Recording error: ${error instanceof Error ? error.message : String(error)}`;
      recordBtnState.val = 'Record';
    }
  };

  const stopRecording = async () => {
    if (!currentRecorder) return;

    try {
      await currentRecorder.stop();
      currentRecorder.dispose();
      currentRecorder = null;
      recordBtnState.val = 'Record';
      status.val = 'Recording stopped';
    } catch (error) {
      currentRecorder = null;
      console.error('Failed to stop recording:', error);
      status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const handleClick = async () => {
    if (recordBtnState.val === 'Record') {
      await startRecording();
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
      if (currentRecorder) {
        currentRecorder.stop();
        currentRecorder.dispose();
        currentRecorder = null;
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
