// Generate keyboard - not in regular use (debugging tool)
const keyboard = document.getElementById('keyboard');

export const createKeyboard = () => {
  const notes = 13; // One octave + C
  for (let i = 0; i < notes; i++) {
    const isBlack = [1, 3, 6, 8, 10].includes(i % 12);
    const note = 60 + i; // Start at middle C (MIDI 60)

    if (!isBlack) {
      const whiteKey = document.createElement('div');
      whiteKey.className = 'white-key';
      whiteKey.dataset.note = note.toString();

      whiteKey.addEventListener('mousedown', () => {
        whiteKey.classList.add('active');
        sampler.playNote(note);
      });

      whiteKey.addEventListener('mouseup', () => {
        whiteKey.classList.remove('active');
        sampler.stopNote(note);
      });

      whiteKey.addEventListener('mouseleave', () => {
        whiteKey.classList.remove('active');
        sampler.stopNote(note);
      });

      keyboard.appendChild(whiteKey);

      // Add black key
      if ([0, 2, 4, 5, 7, 9, 11].includes(i % 12) && i < notes - 1) {
        const blackKey = document.createElement('div');
        blackKey.className = 'black-key';
        blackKey.dataset.note = (note + 1).toString();

        blackKey.addEventListener('mousedown', () => {
          blackKey.classList.add('active');
          sampler.playNote(note + 1);
        });

        blackKey.addEventListener('mouseup', () => {
          blackKey.classList.remove('active');
          sampler.stopNote(note + 1);
        });

        blackKey.addEventListener('mouseleave', () => {
          blackKey.classList.remove('active');
          sampler.stopNote(note + 1);
        });

        whiteKey.appendChild(blackKey);
      }
    }
  }
};
