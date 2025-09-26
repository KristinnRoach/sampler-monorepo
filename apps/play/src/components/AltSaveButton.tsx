import { createSignal, createEffect, JSX } from 'solid-js';

interface AltSaveButtonProps {
  onSave: (name: string) => void;
}

function AltSaveButton(props: AltSaveButtonProps): JSX.Element {
  const [showPrompt, setShowPrompt] = createSignal<boolean>(false);
  const [name, setName] = createSignal<string>('');
  let inputRef: HTMLInputElement | undefined;

  const handleClick = (): void => {
    setShowPrompt(true);
  };

  const handleSave = (): void => {
    if (name().trim().length === 0) {
      alert('Please enter a name.');
      return;
    }
    props.onSave(name());
    setShowPrompt(false);
    setName('');
  };

  // Focus the input when the modal opens
  createEffect(() => {
    if (showPrompt() && inputRef) {
      inputRef.focus();
    }
  });

  const handleKeyDown = (e: KeyboardEvent): void => {
    // Stop propagation to prevent other key handlers from interfering
    e.stopPropagation();

    // Handle Enter key to save
    if (e.key === 'Enter') {
      handleSave();
    }
    // Handle Escape key to cancel
    else if (e.key === 'Escape') {
      setShowPrompt(false);
      setName('');
    }
  };

  return (
    <>
      <button onClick={handleClick}>Save</button>
      {showPrompt() && (
        <div class='modal'>
          <label>
            Enter name:
            <input
              ref={inputRef}
              type='text'
              value={name()}
              onInput={(e: InputEvent & { target: HTMLInputElement }) =>
                setName(e.target.value)
              }
              onKeyDown={handleKeyDown}
            />
          </label>
          <button onClick={handleSave}>Confirm</button>
          <button onClick={() => setShowPrompt(false)}>Cancel</button>
        </div>
      )}
    </>
  );
}

export default AltSaveButton;
