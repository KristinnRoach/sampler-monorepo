import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

// Hide all SVGs except the first
const svgs = document.querySelectorAll('svg');
svgs.forEach((svg, index) => {
  if (index > 0) svg.style.display = 'none';
});

// Get the visible path and all target paths
const visiblePath = svgs[0].querySelector('path:first-of-type');
const allWaveformPaths = Array.from(svgs).map((svg) =>
  svg.querySelector('path:first-of-type')
);

// Create morphing timeline
const tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  defaults: { duration: 1, ease: 'back.inOut' },
});

tl.to(visiblePath, { morphSVG: allWaveformPaths[1] });
// tl.to(visiblePath, {morphSVG: allWaveformPaths[2]});
// tl.to(visiblePath, {morphSVG: allWaveformPaths[3]});
// tl.to(visiblePath, {morphSVG: allWaveformPaths[4]});
// tl.to(visiblePath, {morphSVG: allWaveformPaths[0]});

// // Morph through all waveforms
// allWaveformPaths.slice(1).forEach((targetPath) => {
//   tl.to(visiblePath, {
//     morphSVG: targetPath,
//   });
// });

// // Return to original
// tl.to(visiblePath, {
//   morphSVG: allWaveformPaths[0],
// });
