// main.ts - Main application entry point
import { setupAudio } from '@repo/audiolib';
import { setupBufferPlayer } from '@repo/audiolib';

// Store audio interfaces for both versions
let tsAudio: Awaited<ReturnType<typeof setupAudio>> | null = null;
let jsAudio: Awaited<ReturnType<typeof setupAudio>> | null = null;

// Store buffer player interface
let bufferPlayer: Awaited<ReturnType<typeof setupBufferPlayer>> | null = null;

// Initialize both audio versions when start button is clicked
document.getElementById('startButton')?.addEventListener('click', async () => {
  if (!tsAudio && !jsAudio) {
    try {
      // Initialize both versions
      tsAudio = await setupAudio(false); // TypeScript version
      jsAudio = await setupAudio(true); // JavaScript version

      // Initialize buffer player
      bufferPlayer = await setupBufferPlayer(tsAudio.context);

      console.log('Audio initialized successfully');

      // Default to TS version active at start
      jsAudio.node.disconnect();

      // Enable controls once audio is initialized
      document.querySelectorAll('.audioControl').forEach((control) => {
        (control as HTMLElement).style.opacity = '1';
        (control as HTMLElement).style.pointerEvents = 'auto';
      });

      // Update status
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent = 'Audio running - try the controls!';
        statusEl.className = 'success';
      }

      // Hide start button, show version toggle
      const startBtn = document.getElementById('startButton');
      if (startBtn) {
        startBtn.style.display = 'none';
      }

      const versionToggle = document.getElementById('versionToggle');
      if (versionToggle) {
        versionToggle.style.display = 'block';
      }

      // Show buffer player controls
      const bufferPlayerControls = document.getElementById(
        'bufferPlayerControls'
      );
      if (bufferPlayerControls) {
        bufferPlayerControls.style.display = 'block';
      }
    } catch (error) {
      console.error('Audio initialization failed:', error);
      const statusEl = document.getElementById('status');
      if (statusEl) {
        statusEl.textContent =
          'Audio initialization failed. See console for details.';
        statusEl.className = 'error';
      }
    }
  }
});

// Toggle between TS and JS versions
document.getElementById('toggleVersion')?.addEventListener('click', () => {
  const versionLabel = document.getElementById('currentVersion');

  if (!tsAudio || !jsAudio || !versionLabel) return;

  const isCurrentlyTs = versionLabel.textContent?.includes('TypeScript');

  if (isCurrentlyTs) {
    // Switch to JS version
    tsAudio.node.disconnect();
    jsAudio.node.connect(jsAudio.context.destination);
    versionLabel.textContent = 'JavaScript';
  } else {
    // Switch to TS version
    jsAudio.node.disconnect();
    tsAudio.node.connect(tsAudio.context.destination);
    versionLabel.textContent = 'TypeScript';
  }
});

// Helper to get the active audio interface
function getActiveAudio() {
  const versionLabel = document.getElementById('currentVersion');
  if (!versionLabel || !tsAudio || !jsAudio) return null;

  const isCurrentlyTs = versionLabel.textContent?.includes('TypeScript');
  return isCurrentlyTs ? tsAudio : jsAudio;
}

// Set up UI controls
document.getElementById('volumeSlider')?.addEventListener('input', (e) => {
  const audio = getActiveAudio();
  if (!audio) return;

  const value = parseFloat((e.target as HTMLInputElement).value);
  audio.setVolume(value);

  // Update both versions to keep them in sync
  if (tsAudio) tsAudio.setVolume(value);
  if (jsAudio) jsAudio.setVolume(value);

  // Update volume display
  const volumeEl = document.getElementById('volumeDisplay');
  if (volumeEl) {
    volumeEl.textContent = value.toFixed(2);
  }
});

document.getElementById('noteSlider')?.addEventListener('input', (e) => {
  const audio = getActiveAudio();
  if (!audio) return;

  const value = parseInt((e.target as HTMLInputElement).value, 10);
  audio.setNote(value);

  // Update both versions to keep them in sync
  if (tsAudio) tsAudio.setNote(value);
  if (jsAudio) jsAudio.setNote(value);

  // Update note display
  const noteEl = document.getElementById('noteDisplay');
  if (noteEl) {
    // Convert MIDI note to note name (simplified)
    const notes = [
      'C',
      'C#',
      'D',
      'D#',
      'E',
      'F',
      'F#',
      'G',
      'G#',
      'A',
      'A#',
      'B',
    ];
    const noteName = notes[value % 12];
    const octave = Math.floor(value / 12) - 1;
    noteEl.textContent = `${noteName}${octave} (MIDI: ${value})`;
  }
});

document.getElementById('distortionSlider')?.addEventListener('input', (e) => {
  const audio = getActiveAudio();
  if (!audio) return;

  const value = parseFloat((e.target as HTMLInputElement).value);
  audio.setDistortion(value);

  // Update both versions to keep them in sync
  if (tsAudio) tsAudio.setDistortion(value);
  if (jsAudio) jsAudio.setDistortion(value);

  // Update distortion display
  const distortionEl = document.getElementById('distortionDisplay');
  if (distortionEl) {
    distortionEl.textContent = value.toFixed(2);
  }
});

// Buffer Player Controls

// File Upload
document
  .getElementById('sampleFileInput')
  ?.addEventListener('change', async (e) => {
    if (!bufferPlayer) return;

    const fileInput = e.target as HTMLInputElement;
    const files = fileInput.files;

    if (files && files.length > 0) {
      try {
        const file = files[0];
        const fileInfo = await bufferPlayer.loadAudioFile(file);

        // Update file info display
        const fileInfoEl = document.getElementById('fileInfo');
        if (fileInfoEl) {
          fileInfoEl.textContent = `${file.name} - ${fileInfo.duration.toFixed(
            2
          )}s, ${fileInfo.numChannels} channel(s), ${fileInfo.sampleRate}Hz`;
        }

        // Enable play button
        const playButton = document.getElementById('playButton');
        if (playButton) {
          (playButton as HTMLButtonElement).disabled = false;
        }

        // Enable stop button
        const stopButton = document.getElementById('stopButton');
        if (stopButton) {
          (stopButton as HTMLButtonElement).disabled = false;
        }
      } catch (error) {
        console.error('Error loading audio file:', error);
        alert('Error loading audio file. Please try another file.');
      }
    }
  });

// Play/Pause Button
document.getElementById('playButton')?.addEventListener('click', (e) => {
  if (!bufferPlayer) return;

  const button = e.target as HTMLButtonElement;
  const isPlaying = button.classList.contains('playing');

  if (isPlaying) {
    bufferPlayer.pause();
    button.textContent = 'Play';
    button.classList.remove('playing');
  } else {
    bufferPlayer.play();
    button.textContent = 'Pause';
    button.classList.add('playing');
  }
});

// Stop Button
document.getElementById('stopButton')?.addEventListener('click', () => {
  if (!bufferPlayer) return;

  bufferPlayer.stop();

  // Update play button state
  const playButton = document.getElementById('playButton');
  if (playButton) {
    playButton.textContent = 'Play';
    playButton.classList.remove('playing');
  }
});

// Volume Control
document
  .getElementById('sampleVolumeSlider')
  ?.addEventListener('input', (e) => {
    if (!bufferPlayer) return;

    const value = parseFloat((e.target as HTMLInputElement).value);
    bufferPlayer.setVolume(value);

    // Update volume display
    const volumeEl = document.getElementById('sampleVolumeDisplay');
    if (volumeEl) {
      volumeEl.textContent = value.toFixed(2);
    }
  });

// import { Header } from "@repo/ui/header";
// import "./style.css";
// import typescriptLogo from "/typescript.svg";
// import { Counter } from "@repo/ui/counter";
// import { setupCounter } from "@repo/ui/setup-counter";

// document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="/vite.svg" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://www.typescriptlang.org/" target="_blank">
//       <img src="${typescriptLogo}" class="logo vanilla" alt="TypeScript logo" />
//     </a>
//     ${Header({ title: "Web" })}
//     <div class="card">
//       ${Counter()}
//     </div>
//   </div>
// `;

// setupCounter(document.querySelector<HTMLButtonElement>("#counter")!);
