// components/SaveButton.tsx
import { Component, createSignal, createEffect } from 'solid-js';
import { db, SavedSample } from '../db/samplelib/sampleIdb';
import { captureInstrumentState } from '../utils/instrumentState';
// import { SaveButton as SaveSVGButton } from '@repo/audio-components';
import { audioBufferToWav } from '../utils/audio/audioBufferToWav';

interface SaveButtonProps {
  audioBuffer: AudioBuffer | null;
  isOpen?: boolean;
  disabled?: boolean;
  class?: string;
}

const SaveButton: Component<SaveButtonProps> = (props) => {
  const [saving, setSaving] = createSignal(false);
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [name, setName] = createSignal('');
  let inputRef: HTMLInputElement | undefined;

  const handleClick = () => {
    if (!props.audioBuffer) return;
    setShowPrompt(true);
  };

  const handleSave = async () => {
    if (name().trim().length === 0) {
      alert('Please enter a name.');
      return;
    }

    setSaving(true);
    try {
      const wavData = audioBufferToWav(props.audioBuffer!);

      // Capture current instrument settings
      const settings = captureInstrumentState();

      const sample: SavedSample = {
        name: name(),
        audioData: wavData,
        sampleRate: props.audioBuffer!.sampleRate,
        channels: props.audioBuffer!.numberOfChannels,
        createdAt: new Date(),
        settings, // Include the instrument settings
      };

      await db.samples.add(sample);
      console.log('Sample saved successfully!');
      setShowPrompt(false);
      setName('');
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setShowPrompt(false);
      setName('');
    }
  };

  createEffect(() => {
    if (showPrompt() && inputRef) {
      inputRef.focus();
    }
  });

  const saveCancelButtonStyle = `
  font-size: 0.7rem; 
  max-width: fit-content;
  border-radius: 10%;
  `;

  return (
    <>
      <save-button
        class={`${props.class ? props.class : ''} save-button ${props.isOpen ? 'open' : ''}`}
        disabled={props.disabled || saving()}
        onclick={handleClick}
        title='Save sample'
      ></save-button>
      {showPrompt() && (
        <div class='modal'>
          <label style={'font-size: 0.85rem; overflow-x: visible;'}>
            Name:
            <input
              ref={inputRef}
              type='text'
              value={name()}
              onInput={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              style='max-width: 5rem;'
            />
          </label>
          <div class='flex-row'>
            <button
              onClick={handleSave}
              disabled={saving()}
              style={saveCancelButtonStyle}
            >
              {saving() ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              style={saveCancelButtonStyle}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveButton;
