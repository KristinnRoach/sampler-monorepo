/** Adds event listener & handler for keyboard visual toggle functionality */
export const addKeyboardToggleHandler = () => {
  const toggleButton = document.getElementById(
    'toggle-keyboard-visual'
  ) as HTMLButtonElement;

  const computerKeyVisEl = document.getElementById(
    'keyboard-visual'
  ) as HTMLElement;

  const pianoKeyVisEl = document.getElementById(
    'piano-keyboard'
  ) as HTMLElement;
  let currKeys: 'computer' | 'piano' = 'piano';

  if (toggleButton && computerKeyVisEl) {
    toggleButton.addEventListener('click', () => {
      currKeys = currKeys === 'piano' ? 'computer' : 'piano';

      if (currKeys === 'computer') {
        pianoKeyVisEl.classList.remove('visible');
        pianoKeyVisEl.classList.add('hidden');
        computerKeyVisEl.classList.remove('hidden');
        computerKeyVisEl.classList.add('visible');
        toggleButton.textContent = 'Piano Keys';
      } else {
        pianoKeyVisEl.classList.remove('hidden');
        pianoKeyVisEl.classList.add('visible');
        computerKeyVisEl.classList.remove('visible');
        computerKeyVisEl.classList.add('hidden');
        toggleButton.textContent = 'Computer Keys';
      }
    });
  }
};

// SPLINE code not used:
// <!-- <spline-viewer
//    id="keyboard-visual"
//    class="keyboard-visual hidden"
//    loading-anim-type="none"
//    url="https://prod.spline.design/ZpiHTUHQUsP10Dtk/scene.splinecode"
//  ></spline-viewer> -->
//              <!-- <button id="toggle-keyboard-visual" class="keyboard-visual-toggle">
//      Show Keyboard
//    </button> -->
//        <!-- <script type="module" src="./src/utils/splineWarnings.ts">
//   /** Script to suppress warnings from the spline viewer about passive event listeners */
// </script>

// <script
//   type="module"
//   src="https://unpkg.com/@splinetool/viewer@1.10.44/build/spline-viewer.js"
// ></script> -->
