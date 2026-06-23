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
  onSavedCallback?: () => unknown;
}

// TODO: replace with dumb ui compenent e.g. BaseButton

const SaveButton: Component<SaveButtonProps> = (props) => {
  const [saving, setSaving] = createSignal(false);
  const [showPrompt, setShowPrompt] = createSignal(false);
  const [name, setName] = createSignal('');
  let inputRef: HTMLInputElement | undefined;
  let saveBtnWrapperRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (props.isOpen === true || props.isOpen === false) {
      if (saveBtnWrapperRef !== undefined) {
        if (props.isOpen) saveBtnWrapperRef.classList.add('--sidebar-open');
        else saveBtnWrapperRef.classList.remove('--sidebar-open');
      }
    }
  }, [props.isOpen]);

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
      props.onSavedCallback?.();

      document.dispatchEvent(new CustomEvent('sample:saved'));
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

  return (
    <>
      <save-button
        class={`${props.class ? props.class : ''} save-button ${showPrompt() ? 'open' : ''}`}
        disabled={props.disabled || saving()}
        onclick={handleClick}
        title='Save sample'
      ></save-button>
      {showPrompt() && (
        <div class='save-popup'>
          <span class='save-popup-header'>Save Sample</span>

          <input
            title={`Sample Name`}
            ref={inputRef}
            type='text'
            placeholder={`Sample Name`}
            value={name()}
            onInput={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div class='save-popup-buttons'>
            <button onClick={handleSave} disabled={saving()}>
              {saving() ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setShowPrompt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveButton;
