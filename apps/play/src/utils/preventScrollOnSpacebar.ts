export const addPreventScrollOnSpacebarListener = (
  target: EventTarget = window
) => {
  target.addEventListener('keydown', (e) => {
    const keyboardEvent = e as KeyboardEvent;
    if (
      keyboardEvent.code === 'Space' &&
      !(
        keyboardEvent.target instanceof HTMLInputElement ||
        keyboardEvent.target instanceof HTMLTextAreaElement ||
        (keyboardEvent.target instanceof HTMLElement &&
          keyboardEvent.target.isContentEditable)
      )
    ) {
      keyboardEvent.preventDefault();
    }
  });
};
