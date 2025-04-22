// Import the SamplerElement from the audiolib package
import '@repo/audiolib/src/wc/sampler-element';

// Get references to DOM elements
const sampler = document.getElementById('mySampler');
const loopStartSlider = document.getElementById('loopStart');
const loopEndSlider = document.getElementById('loopEnd');
const loopStartValue = document.getElementById('loopStartValue');
const loopEndValue = document.getElementById('loopEndValue');
const infoElement = document.getElementById('info');
const keyboard = document.getElementById('keyboard');

// Generate keyboard
const createKeyboard = () => {
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
      
      // Add black key if needed
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

// Create the piano keyboard
createKeyboard();

// Event listeners for the custom element
sampler.addEventListener('sampler-initialized', () => {
  infoElement.innerHTML = '<p>Sampler initialized! Load a sample to begin.</p>';
});

sampler.addEventListener('sample-loaded', (e) => {
  const { duration, filename } = e.detail;
  
  infoElement.innerHTML = `
    <p>Sample loaded: ${filename}</p>
    <p>Duration: ${duration.toFixed(2)}s</p>
  `;
  
  // Enable loop controls
  loopStartSlider.disabled = false;
  loopEndSlider.disabled = false;
  loopEndSlider.value = '1';
  loopEndValue.textContent = duration.toFixed(2);
});

// Loop controls event listeners
loopStartSlider.addEventListener('input', (e) => {
  const normalizedValue = parseFloat(e.target.value);
  const actualValue = normalizedValue * sampler.sampleDuration;
  loopStartValue.textContent = actualValue.toFixed(2);
  
  // Ensure start is before end
  if (normalizedValue >= parseFloat(loopEndSlider.value)) {
    loopEndSlider.value = Math.min(1, normalizedValue + 0.01).toString();
    const endValue = parseFloat(loopEndSlider.value) * sampler.sampleDuration;
    loopEndValue.textContent = endValue.toFixed(2);
    sampler.setLoopEnd(endValue);
  }
  
  sampler.setLoopStart(actualValue);
});

loopEndSlider.addEventListener('input', (e) => {
  const normalizedValue = parseFloat(e.target.value);
  const actualValue = normalizedValue * sampler.sampleDuration;
  loopEndValue.textContent = actualValue.toFixed(2);
  
  // Ensure end is after start
  if (normalizedValue <= parseFloat(loopStartSlider.value)) {
    loopStartSlider.value = Math.max(0, normalizedValue - 0.01).toString();
    const startValue = parseFloat(loopStartSlider.value) * sampler.sampleDuration;
    loopStartValue.textContent = startValue.toFixed(2);
    sampler.setLoopStart(startValue);
  }
  
  sampler.setLoopEnd(actualValue);
});

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  
  const keyMap = {
    'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64,
    'f': 65, 't': 66, 'g': 67, 'y': 68, 'h': 69,
    'u': 70, 'j': 71, 'k': 72
  };
  
  const note = keyMap[e.key.toLowerCase()];
  if (note !== undefined) {
    document.querySelector(`.white-key[data-note="${note}"], .black-key[data-note="${note}"]`)?.classList.add('active');
    sampler.playNote(note);
  }
});

document.addEventListener('keyup', (e) => {
  const keyMap = {
    'a': 60, 'w': 61, 's': 62, 'e': 63, 'd': 64,
    'f': 65, 't': 66, 'g': 67, 'y': 68, 'h': 69,
    'u': 70, 'j': 71, 'k': 72
  };
  
  const note = keyMap[e.key.toLowerCase()];
  if (note !== undefined) {
    document.querySelector(`.white-key[data-note="${note}"], .black-key[data-note="${note}"]`)?.classList.remove('active');
    sampler.stopNote(note);
  }
});

// Display a welcome message
console.log('Web Audio Elements app initialized');
