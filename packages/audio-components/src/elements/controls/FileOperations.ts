// FileOperations.ts
import van, { State } from '@repo/vanjs-core';
import { SamplePlayer } from '@repo/audiolib';

const { div, button } = van.tags;

export const FileOperations = (
  samplePlayer: SamplePlayer | null,
  status: State<string>,
  recordBtnState: State<'Record' | 'Armed' | 'Recording'>,
  onLoadSample: () => void,
  onStartRecording: () => void,
  onStopRecording: () => void
) => {
  const buttonStyle =
    'padding: 0.2rem 0.5rem; margin: 0.1rem 0; cursor: pointer';

  return div(
    {
      style: 'display: flex; gap: 10px; margin-bottom: 1rem;',
    },
    button({ style: buttonStyle, onclick: onLoadSample }, 'Upload'),
    button(
      {
        style: buttonStyle,
        onclick: () =>
          recordBtnState.val === 'Recording' || recordBtnState.val === 'Armed'
            ? onStopRecording()
            : onStartRecording(),
      },
      () => recordBtnState.val
    )
  );
};
