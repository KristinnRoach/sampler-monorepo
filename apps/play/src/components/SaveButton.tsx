// components/SaveButton.tsx
import {
  Component,
  createSignal,
  createEffect,
  onCleanup,
  onMount,
} from 'solid-js';
import { db, SavedSample } from '../db/samplelib/sampleIdb';
import { snapshotSamplerParamValues } from '../utils/samplerParamState';
import { audioBufferToWav } from '../utils/audio/bufferUtils';

interface SaveButtonProps {
  audioBuffer: AudioBuffer | null;
  savedSample?: { id: number; name: string } | null;
  isOpen?: boolean;
  disabled?: boolean;
  class?: string;
  onSavedCallback?: (sample: { id: number; name: string }) => unknown;
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
    setName(props.savedSample?.name ?? '');
    setShowPrompt(true);
  };

  const handleSave = async (saveAsNew = false) => {
    const sampleName = name().trim();
    if (sampleName.length === 0) {
      alert('Please enter a name.');
      return;
    }

    setSaving(true);
    try {
      const wavData = audioBufferToWav(props.audioBuffer!);

      const sample: SavedSample = {
        name: sampleName,
        audioData: wavData,
        sampleRate: props.audioBuffer!.sampleRate,
        channels: props.audioBuffer!.numberOfChannels,
        patch: { params: snapshotSamplerParamValues() },
      };

      let id: number;
      if (props.savedSample && !saveAsNew) {
        id = props.savedSample.id;
        const updated = await db.samples.update(id, sample);
        if (!updated) throw new Error(`Saved sample ${id} no longer exists`);
      } else {
        id = await db.samples.add({ ...sample, createdAt: new Date() });
      }

      console.log('Sample saved successfully!');
      setShowPrompt(false);
      setName('');
      props.onSavedCallback?.({ id, name: sampleName });

      document.dispatchEvent(new CustomEvent('sample:saved'));
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      void handleSave();
    } else if (e.key === 'Escape') {
      setShowPrompt(false);
      setName('');
    }
  };

  const handleSaveShortcut = (e: KeyboardEvent) => {
    if (
      e.key.toLowerCase() !== 's' ||
      (!e.metaKey && !e.ctrlKey) ||
      e.altKey ||
      e.shiftKey
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    if (!props.audioBuffer || props.disabled || saving()) return;

    if (showPrompt()) void handleSave();
    else handleClick();
  };

  onMount(() => document.addEventListener('keydown', handleSaveShortcut, true));
  onCleanup(() =>
    document.removeEventListener('keydown', handleSaveShortcut, true),
  );

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
        title={
          props.savedSample
            ? `Save changes to ${props.savedSample.name}`
            : 'Save sample'
        }
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
            <button onClick={() => void handleSave()} disabled={saving()}>
              {saving()
                ? 'Saving...'
                : props.savedSample
                  ? 'Update'
                  : 'Save'}
            </button>
            {props.savedSample && (
              <button
                onClick={() => void handleSave(true)}
                disabled={saving()}
              >
                Save as new
              </button>
            )}
            <button onClick={() => setShowPrompt(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};

export default SaveButton;
