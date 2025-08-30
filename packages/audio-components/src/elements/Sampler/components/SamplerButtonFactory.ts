// SamplerButtonFactory.ts -
import van, { State } from '@repo/vanjs-core';
import { ElementProps } from '@repo/vanjs-core/element';
import { createAudioRecorder, type Recorder } from '@repo/audiolib';
import { getSampler, onRegistryChange } from '../SamplerRegistry';
import { findNodeId } from '../component-utils';
import { COMPONENT_STYLE } from '../../../shared/styles/component-styles';
import { createSVGButton } from '../../primitives/createSVGButton';

const { div } = van.tags;

// ===== UPLOAD BUTTON =====

export const UploadButton = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const showStatus = attributes.attr('show-status', 'false');
  const status = van.state('Ready');

  const getId = findNodeId(attributes, targetNodeId);

  const loadSample = async () => {
    const nodeId = getId();
    if (!nodeId) {
      status.val = 'Sampler not found';
      return;
    }
    const sampler = getSampler(nodeId);
    if (!sampler) {
      status.val = 'Sampler not found';
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'audio/*';

    fileInput.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;

      if (files && files.length > 0) {
        const file = files[0];
        status.val = `Loading: ${file.name}...`;

        try {
          const arrayBuffer = await file.arrayBuffer();
          await sampler.loadSample(arrayBuffer);
          status.val = `Loaded: ${file.name}`;
        } catch (error) {
          status.val = `Error: ${error}`;
        }
      }
    };

    fileInput.click();
  };

  // Create SVG upload button using new function API
  const uploadButton = createSVGButton('Upload Sample', 'upload', {
    size: 'md',
    onClick: loadSample,
  });

  return div(
    { style: COMPONENT_STYLE },
    uploadButton,
    ...(showStatus.val === 'true' ? [div(() => status.val)] : [])
  );
};

// ===== RECORD BUTTON =====

export const RecordButton = (attributes: ElementProps) => {
  const targetNodeId: State<string> = attributes.attr('target-node-id', '');
  const showStatus = attributes.attr('show-status', 'false');
  const status = van.state('Ready');

  const currentRecorder: State<Recorder | null> = van.state(null);
  const recordBtnState: State<'Record' | 'Armed' | 'Recording'> =
    van.state('Record');
  const samplerAvailable = van.state(false);

  let recordButton: HTMLButtonElement & { setState?: (state: string) => void };

  const startRecording = async () => {
    const sampler = getSampler(targetNodeId.val);
    if (!sampler || recordBtnState.val === 'Recording') return;

    const inputSource = sampler.getRecorderInputSource();

    try {
      const recorderResult = await createAudioRecorder(sampler.context);

      if (!recorderResult) {
        status.val = 'Failed to create recorder';
        return;
      }

      recorderResult.setInputSource(inputSource ?? 'microphone');

      currentRecorder.val = recorderResult;
      currentRecorder.val.connect(sampler);

      currentRecorder.val.onMessage('state-change', (msg: any) => {
        status.val = msg.state;

        switch (msg.state) {
          case 'ARMED':
            recordBtnState.val = 'Armed';
            recordButton?.setState?.('record_armed');
            break;
          case 'RECORDING':
            recordBtnState.val = 'Recording';
            recordButton?.setState?.('record_recording');
            break;
          case 'IDLE':
          case 'STOPPED':
          default:
            recordBtnState.val = 'Record';
            recordButton?.setState?.('record_inactive');
            break;
        }
      });

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
      recordButton?.setState?.('record_inactive');
    }
  };

  const stopRecording = async () => {
    if (!currentRecorder.val) return;

    try {
      await currentRecorder.val.stop();
      currentRecorder.val.dispose();
      currentRecorder.val = null;
      recordBtnState.val = 'Record';
      recordButton?.setState?.('record_inactive');
      status.val = 'Recording stopped';
    } catch (error) {
      currentRecorder.val = null;
      recordBtnState.val = 'Record';
      recordButton?.setState?.('record_inactive');
      console.error('Failed to stop recording:', error);
      status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
    }
  };

  const handleClick = async () => {
    if (recordBtnState.val === 'Record') {
      await startRecording();
    } else if (recordBtnState.val === 'Armed') {
      if (currentRecorder.val) {
        currentRecorder.val.forceStart();
      }
    } else {
      await stopRecording();
    }
  };

  // Create SVG record button using new function API
  recordButton = createSVGButton(
    'Record Sample',
    ['record_inactive', 'record_armed', 'record_recording'],
    {
      size: 'md',
      onClick: handleClick,
      colors: {
        record_inactive: '#FFFFFF',
        record_armed: '#f59e0b',
        record_recording: '#ef4444',
      },
    }
  );

  van.derive(() => {
    recordButton.disabled = !samplerAvailable.val;
    recordButton.style.opacity = samplerAvailable.val ? '1' : '0.5';
  });

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
    { style: COMPONENT_STYLE },
    recordButton,
    ...(showStatus.val === 'true' ? [div(() => status.val)] : [])
  );
};

// // SamplerButtonFactory.ts - Button components for sampler controls
// import van, { State } from '@repo/vanjs-core';
// import { ElementProps } from '@repo/vanjs-core/element';
// import { createAudioRecorder, type Recorder } from '@repo/audiolib';
// import { getSampler, onRegistryChange } from '../SamplerRegistry';
// import { createFindNodeId } from '../../../shared/utils/component-utils';
// import {
//   COMPONENT_STYLE,
//   BUTTON_STYLE,
//   BUTTON_ACTIVE_STYLE,
//   RECORD_BUTTON_RECORDING_STYLE,
//   RECORD_BUTTON_ARMED_STYLE,
// } from '../../../shared/styles/component-styles';

// const { div, button } = van.tags;

// // ===== UPLOAD BUTTON =====

// export const UploadButton = (attributes: ElementProps) => {
//   const targetNodeId: State<string> = attributes.attr('target-node-id', '');
//   const showStatus = attributes.attr('show-status', 'false');
//   const status = van.state('Ready');

//   const findNodeId = createFindNodeId(attributes, targetNodeId);

//   const loadSample = async () => {
//     const nodeId = findNodeId();
//     if (!nodeId) {
//       status.val = 'Sampler not found';
//       return;
//     }
//     const sampler = getSampler(nodeId);
//     if (!sampler) {
//       status.val = 'Sampler not found';
//       return;
//     }

//     const fileInput = document.createElement('input');
//     fileInput.type = 'file';
//     fileInput.accept = 'audio/*';

//     fileInput.onchange = async (event) => {
//       const target = event.target as HTMLInputElement;
//       const files = target.files;

//       if (files && files.length > 0) {
//         const file = files[0];
//         status.val = `Loading: ${file.name}...`;

//         try {
//           const arrayBuffer = await file.arrayBuffer();
//           await sampler.loadSample(arrayBuffer);
//           status.val = `Loaded: ${file.name}`;
//         } catch (error) {
//           status.val = `Error: ${error}`;
//         }
//       }
//     };

//     fileInput.click();
//   };

//   return div(
//     { style: COMPONENT_STYLE },
//     button(
//       {
//         onclick: loadSample,
//         style: BUTTON_STYLE,
//       },
//       'Upload'
//     ),
//     ...(showStatus.val === 'true' ? [div(() => status.val)] : [])
//   );
// };

// // ===== RECORD BUTTON =====

// export const RecordButton = (attributes: ElementProps) => {
//   const targetNodeId: State<string> = attributes.attr('target-node-id', '');
//   const showStatus = attributes.attr('show-status', 'false');
//   const status = van.state('Ready');

//   const currentRecorder: State<Recorder | null> = van.state(null);
//   const recordBtnState: State<'Record' | 'Armed' | 'Recording'> =
//     van.state('Record');
//   const samplerAvailable = van.state(false);

//   const startRecording = async () => {
//     const sampler = getSampler(targetNodeId.val);
//     if (!sampler || recordBtnState.val === 'Recording') return;

//     try {
//       const recorderResult = await createAudioRecorder(sampler.context);

//       if (!recorderResult) {
//         status.val = 'Failed to create recorder';
//         return;
//       }

//       currentRecorder.val = recorderResult;
//       currentRecorder.val.connect(sampler);

//       currentRecorder.val.onMessage('state-change', (msg: any) => {
//         status.val = msg.state;

//         switch (msg.state) {
//           case 'ARMED':
//             recordBtnState.val = 'Armed';
//             break;
//           case 'RECORDING':
//             recordBtnState.val = 'Recording';
//             break;
//           case 'IDLE':
//           case 'STOPPED':
//           default:
//             recordBtnState.val = 'Record';
//             break;
//         }
//       });

//       await currentRecorder.val.start({
//         useThreshold: true,
//         startThreshold: -30,
//         autoStop: true,
//         stopThreshold: -40,
//         silenceTimeoutMs: 1000,
//       });
//     } catch (error) {
//       console.error('Failed to start recording:', error);
//       status.val = `Recording error: ${error instanceof Error ? error.message : String(error)}`;
//       currentRecorder.val = null;
//       recordBtnState.val = 'Record';
//     }
//   };

//   const stopRecording = async () => {
//     if (!currentRecorder.val) return;

//     try {
//       await currentRecorder.val.stop();
//       currentRecorder.val.dispose();
//       currentRecorder.val = null;
//       recordBtnState.val = 'Record';
//       status.val = 'Recording stopped';
//     } catch (error) {
//       currentRecorder.val = null;
//       recordBtnState.val = 'Record';
//       console.error('Failed to stop recording:', error);
//       status.val = `Stop error: ${error instanceof Error ? error.message : String(error)}`;
//     }
//   };

//   const handleClick = async () => {
//     if (recordBtnState.val === 'Record') {
//       await startRecording();
//     } else if (recordBtnState.val === 'Armed') {
//       if (currentRecorder.val) {
//         currentRecorder.val.forceStart();
//       }
//     } else {
//       await stopRecording();
//     }
//   };

//   const getButtonText = () => {
//     switch (recordBtnState.val) {
//       case 'Armed':
//         return 'Armed';
//       case 'Recording':
//         return 'Recording';
//       default:
//         return 'Record';
//     }
//   };

//   const getButtonStyle = () => {
//     const baseStyle = BUTTON_STYLE;
//     if (recordBtnState.val === 'Recording') {
//       return `${baseStyle} ${BUTTON_ACTIVE_STYLE} ${RECORD_BUTTON_RECORDING_STYLE}`;
//     } else if (recordBtnState.val === 'Armed') {
//       return `${baseStyle} ${BUTTON_ACTIVE_STYLE} ${RECORD_BUTTON_ARMED_STYLE}`;
//     }
//     return baseStyle;
//   };

//   attributes.mount(() => {
//     const checkSampler = () =>
//       (samplerAvailable.val = !!getSampler(targetNodeId.val));

//     const cleanupSamplerCheck = onRegistryChange(checkSampler);

//     return () => {
//       if (currentRecorder.val) {
//         currentRecorder.val.stop();
//         currentRecorder.val.dispose();
//         currentRecorder.val = null;
//         recordBtnState.val = 'Record';
//       }
//       cleanupSamplerCheck();
//     };
//   });

//   return div(
//     { style: COMPONENT_STYLE },
//     button(
//       {
//         onclick: handleClick,
//         style: () => getButtonStyle(),
//         disabled: () => !samplerAvailable.val,
//       },
//       getButtonText
//     ),
//     ...(showStatus.val === 'true' ? [div(() => status.val)] : [])
//   );
// };
