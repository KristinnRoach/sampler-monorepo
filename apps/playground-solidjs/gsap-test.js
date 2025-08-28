import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

// Hide all SVGs except the first
const svgs = document.querySelectorAll('svg');
svgs.forEach((svg, index) => {
  if (index > 0) svg.style.display = 'none';
});

// Get the visible SVG and its waveform path
const visibleSvg = svgs[0];
const visiblePath = visibleSvg.querySelector('path:first-of-type');

// Get all waveform paths for morphing
const allWaveformPaths = Array.from(svgs).map((svg) =>
  svg.querySelector('path:first-of-type')
);

// Split path function
function splitPath(pathElement) {
  const pathData = pathElement.getAttribute('d');
  const lastHIndex = pathData.lastIndexOf('h102.4');

  if (lastHIndex > -1) {
    return {
      waveform: pathData.substring(0, lastHIndex),
      flatLine: pathData.substring(lastHIndex),
    };
  }
  return { waveform: pathData, flatLine: '' };
}

// Function to get the end point of a path
function getPathEndPoint(pathData) {
  const tempPath = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  tempPath.setAttribute('d', pathData);
  document.body.appendChild(tempPath); // Temporarily add to DOM
  const pathLength = tempPath.getTotalLength();
  const endPoint = tempPath.getPointAtLength(pathLength);
  document.body.removeChild(tempPath); // Remove from DOM
  return endPoint;
}

const { waveform, flatLine } = splitPath(visiblePath);

// Create separate paths
visiblePath.style.display = 'none';

// Morphing path (waveform only)
const morphingPath = visiblePath.cloneNode();
morphingPath.setAttribute('d', waveform);
morphingPath.style.display = 'block';
visibleSvg.appendChild(morphingPath);

// Static path (flat line) - dynamically positioned
const staticPath = visiblePath.cloneNode();
const initialEndPoint = getPathEndPoint(waveform);
staticPath.setAttribute(
  'd',
  `M${initialEndPoint.x},${initialEndPoint.y}h102.4`
);
staticPath.style.display = 'block';
visibleSvg.appendChild(staticPath);

// Create temporary target paths for morphing
const targetPaths = [];
allWaveformPaths.slice(1).forEach((targetPath, index) => {
  const targetWaveform = splitPath(targetPath).waveform;
  const tempPath = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'path'
  );
  tempPath.setAttribute('d', targetWaveform);
  tempPath.style.display = 'none';
  visibleSvg.appendChild(tempPath);
  targetPaths.push(tempPath);
});

// Create morphing timeline
const tl = gsap.timeline({
  repeat: -1,
  yoyo: true,
  defaults: {
    duration: 0.5,
    ease: 'back.inOut',
  },
});

// Morph to each target path and update static line position
targetPaths.forEach((targetPath) => {
  tl.to(morphingPath, {
    morphSVG: targetPath,
    onUpdate: function () {
      // Update static line position during morph
      const currentEndPoint = getPathEndPoint(morphingPath.getAttribute('d'));
      staticPath.setAttribute(
        'd',
        `M${currentEndPoint.x},${currentEndPoint.y}h102.4`
      );
    },
  });
});

// Return to start
const originalTempPath = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'path'
);
originalTempPath.setAttribute('d', waveform);
originalTempPath.style.display = 'none';
visibleSvg.appendChild(originalTempPath);

tl.to(morphingPath, {
  morphSVG: originalTempPath,
  onUpdate: function () {
    const currentEndPoint = getPathEndPoint(morphingPath.getAttribute('d'));
    staticPath.setAttribute(
      'd',
      `M${currentEndPoint.x},${currentEndPoint.y}h102.4`
    );
  },
});

// import gsap from 'gsap';
// import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

// gsap.registerPlugin(MorphSVGPlugin);

// // Hide all SVGs except the first
// const svgs = document.querySelectorAll('svg');
// svgs.forEach((svg, index) => {
//   if (index > 0) svg.style.display = 'none';
// });

// // Get the visible SVG and its waveform path
// const visibleSvg = svgs[0];
// const visiblePath = visibleSvg.querySelector('path:first-of-type');

// // Get all waveform paths for morphing
// const allWaveformPaths = Array.from(svgs).map((svg) =>
//   svg.querySelector('path:first-of-type')
// );

// // Split path function
// function splitPath(pathElement) {
//   const pathData = pathElement.getAttribute('d');
//   const lastHIndex = pathData.lastIndexOf('h102.4');

//   if (lastHIndex > -1) {
//     return {
//       waveform: pathData.substring(0, lastHIndex),
//       flatLine: pathData.substring(lastHIndex),
//     };
//   }
//   return { waveform: pathData, flatLine: '' };
// }

// const { waveform, flatLine } = splitPath(visiblePath);

// // Create separate paths
// visiblePath.style.display = 'none';

// // Morphing path (waveform only)
// const morphingPath = visiblePath.cloneNode();
// morphingPath.setAttribute('d', waveform);
// morphingPath.style.display = 'block';
// visibleSvg.appendChild(morphingPath);

// // Static path (flat line) - create a simple horizontal line at y=256
// const staticPath = visiblePath.cloneNode();
// staticPath.setAttribute('d', 'M473.6 256h102.4'); // Direct flat line
// staticPath.style.display = 'block';
// visibleSvg.appendChild(staticPath);

// // Create temporary target paths for morphing
// const targetPaths = [];
// allWaveformPaths.slice(1).forEach((targetPath, index) => {
//   const targetWaveform = splitPath(targetPath).waveform;
//   const tempPath = document.createElementNS(
//     'http://www.w3.org/2000/svg',
//     'path'
//   );
//   tempPath.setAttribute('d', targetWaveform);
//   tempPath.style.display = 'none';
//   visibleSvg.appendChild(tempPath);
//   targetPaths.push(tempPath);
// });

// // Create morphing timeline
// const tl = gsap.timeline({
//   repeat: -1,
//   yoyo: true,
//   defaults: {
//     duration: 0.5,
//     ease: 'back.inOut',
//   },
// });

// // Morph to each target path element (not string)
// targetPaths.forEach((targetPath) => {
//   tl.to(morphingPath, {
//     morphSVG: targetPath, // Pass the element, not the path data string
//   });
// });

// // Return to start - create temp path for original waveform
// const originalTempPath = document.createElementNS(
//   'http://www.w3.org/2000/svg',
//   'path'
// );
// originalTempPath.setAttribute('d', waveform);
// originalTempPath.style.display = 'none';
// visibleSvg.appendChild(originalTempPath);

// tl.to(morphingPath, {
//   morphSVG: originalTempPath,
// });

// // Hide all SVGs except the first
// const svgs = document.querySelectorAll('svg');
// svgs.forEach((svg, index) => {
//   if (index > 0) svg.style.display = 'none';
// });

// // Get the visible SVG and its waveform path
// const visibleSvg = svgs[0];
// const visiblePath = visibleSvg.querySelector('path:first-of-type');

// // Get all waveform paths for morphing (keep them as targets only)
// const allWaveformPaths = Array.from(svgs).map((svg) =>
//   svg.querySelector('path:first-of-type')
// );

// // Split the visible path to separate waveform from flat line
// function splitPath(pathElement) {
//   const pathData = pathElement.getAttribute('d');
//   // Find the last occurrence of 'h102.4' (the flat line)
//   const lastHIndex = pathData.lastIndexOf('h102.4');

//   if (lastHIndex > -1) {
//     return {
//       waveform: pathData.substring(0, lastHIndex),
//       flatLine: pathData.substring(lastHIndex),
//     };
//   }
//   return { waveform: pathData, flatLine: '' };
// }

// const { waveform, flatLine } = splitPath(visiblePath);

// // Create separate paths in the visible SVG
// visiblePath.style.display = 'none';

// // Morphing path (waveform only)
// const morphingPath = visiblePath.cloneNode();
// morphingPath.setAttribute('d', waveform);
// morphingPath.style.display = 'block';
// visibleSvg.appendChild(morphingPath);

// // Static path (flat line only) - position it correctly
// const staticPath = visiblePath.cloneNode();
// // Get the end point of the waveform to position the flat line
// const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
// tempPath.setAttribute('d', waveform);
// const pathLength = tempPath.getTotalLength();
// const endPoint = tempPath.getPointAtLength(pathLength);

// staticPath.setAttribute('d', `M${endPoint.x} ${endPoint.y} ${flatLine}`);
// staticPath.style.display = 'block';
// visibleSvg.appendChild(staticPath);

// // Create morphing timeline
// const tl = gsap.timeline({
//   repeat: -1,
//   yoyo: true,
//   defaults: {
//     duration: 0.5,
//     ease: 'back.inOut',
//   },
// });

// // Morph through each waveform (extract just the waveform part)
// allWaveformPaths.slice(1).forEach((targetPath) => {
//   const targetWaveform = splitPath(targetPath).waveform;
//   tl.to(morphingPath, {
//     morphSVG: targetWaveform,
//   });
// });

// // Return to start
// tl.to(morphingPath, {
//   duration: 0.5,
//   morphSVG: waveform,
// });

// // Hide all SVGs except the first
// const svgs = document.querySelectorAll('svg');
// svgs.forEach((svg, index) => {
//   if (index > 0) svg.style.display = 'none';
// });

// const visibleSvg = svgs[0];
// const visiblePath = visibleSvg.querySelector('path:first-of-type');

// const allWaveformPaths = Array.from(svgs).map((svg) =>
//   svg.querySelector('path:first-of-type')
// );

// // Split path to separate start line, waveform, and end line
// function splitPathComplete(pathElement) {
//   const pathData = pathElement.getAttribute('d');

//   // Find start line: M38.4 256h102.4
//   const startMatch = pathData.match(/^(M38\.4 256h102\.4)(.*)/);
//   if (!startMatch) return { startLine: '', waveform: pathData, flatLine: '' };

//   const startLine = startMatch[1];
//   const remainder = startMatch[2];

//   // Find end line from remainder
//   const lastHIndex = remainder.lastIndexOf('h102.4');
//   if (lastHIndex > -1) {
//     return {
//       startLine: startLine,
//       waveform: remainder.substring(0, lastHIndex),
//       flatLine: remainder.substring(lastHIndex),
//     };
//   }

//   return { startLine: startLine, waveform: remainder, flatLine: '' };
// }

// const { startLine, waveform, flatLine } = splitPathComplete(visiblePath);

// visiblePath.style.display = 'none';

// // Static start line
// const staticStartPath = visiblePath.cloneNode();
// staticStartPath.setAttribute('d', startLine);
// staticStartPath.style.display = 'block';
// visibleSvg.appendChild(staticStartPath);

// // Morphing path (middle waveform section only)
// const morphingPath = visiblePath.cloneNode();
// // Position morphing path after start line
// const tempStartPath = document.createElementNS(
//   'http://www.w3.org/2000/svg',
//   'path'
// );
// tempStartPath.setAttribute('d', startLine);
// const startLength = tempStartPath.getTotalLength();
// const startEndPoint = tempStartPath.getPointAtLength(startLength);

// morphingPath.setAttribute(
//   'd',
//   `M${startEndPoint.x} ${startEndPoint.y} ${waveform}`
// );
// morphingPath.style.display = 'block';
// visibleSvg.appendChild(morphingPath);

// // const staticEndPath = visiblePath.cloneNode();
// // const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
// // tempPath.setAttribute('d', waveform); // This will still error because waveform is incomplete
// // const pathLength = tempPath.getTotalLength();
// // const endPoint = tempPath.getPointAtLength(pathLength);

// // staticEndPath.setAttribute('d', `M${endPoint.x} ${endPoint.y} ${flatLine}`);
// // staticEndPath.style.display = 'block';
// // visibleSvg.appendChild(staticEndPath);

// // Static end line - corrected approach
// const staticEndPath = visiblePath.cloneNode();
// // Use the complete original path to find the end point
// const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
// tempPath.setAttribute('d', visiblePath.getAttribute('d')); // Use complete original path
// const pathLength = tempPath.getTotalLength();
// const endPoint = tempPath.getPointAtLength(pathLength);

// // Calculate where the flat line should start (subtract flat line length)
// const flatLineStart = tempPath.getPointAtLength(pathLength - 102.4);

// staticEndPath.setAttribute(
//   'd',
//   `M${flatLineStart.x} ${flatLineStart.y} ${flatLine}`
// );
// staticEndPath.style.display = 'block';
// visibleSvg.appendChild(staticEndPath);

// // Create morphing timeline
// const tl = gsap.timeline({
//   repeat: -1,
//   yoyo: true,
//   defaults: {
//     duration: 0.5,
//     ease: 'back.inOut',
//   },
// });

// // Morph through each waveform (extract just the middle waveform part)
// allWaveformPaths.slice(1).forEach((targetPath) => {
//   const targetWaveform = splitPathComplete(targetPath).waveform;
//   tl.to(morphingPath, {
//     morphSVG: `M${startEndPoint.x} ${startEndPoint.y} ${targetWaveform} `,
//   });
// });

// // Return to start
// tl.to(morphingPath, {
//   duration: 0.5,
//   morphSVG: `M${startEndPoint.x} ${startEndPoint.y} ${waveform}`,
// });
