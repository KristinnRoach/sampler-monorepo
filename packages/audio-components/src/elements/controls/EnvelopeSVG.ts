// EnvelopeSVG.ts
import van from '@repo/vanjs-core';
import { type CustomEnvelope, DEFAULT_ENV } from '@repo/audiolib';

const { svg, path, line, g, div } = van.tags('http://www.w3.org/2000/svg');

export const EnvelopeSVG = (
  envelope: CustomEnvelope | null,
  width: string = '100%',
  height: string = '120px'
) => {
  if (!envelope) {
    return div(
      {
        style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
      },
      'Loading envelope...'
    );
  }

  // UI states
  const selectedPoint = van.state<number | null>(null);
  const isDragging = van.state(false);

  let svgElement: SVGSVGElement;
  let pointsGroup: SVGGElement;

  // UI update trigger
  const updateTrigger = van.state(0);

  const unsubscribe = envelope?.onChange(() => {
    updateTrigger.val++;
  });

  const updateControlPoints = () => {
    if (!pointsGroup) return;

    pointsGroup.innerHTML = '';
    const points = envelope?.getPoints() || DEFAULT_ENV;

    points.forEach((point, index) => {
      const circle = document.createElementNS(
        'http://www.w3.org/2000/svg',
        'circle'
      );

      circle.setAttribute('cx', (point.time * 400).toString());
      circle.setAttribute('cy', ((1 - point.value) * 200).toString());
      circle.setAttribute('r', '4');
      circle.setAttribute(
        'fill',
        selectedPoint.val === index ? '#ff6b6b' : '#4ade80'
      );
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '1');
      circle.style.cursor = 'pointer';

      circle.addEventListener('mousedown', (e: MouseEvent) => {
        selectedPoint.val = index;
        isDragging.val = true;
        e.preventDefault();
      });

      if (index > 0 && index < points.length - 1) {
        circle.addEventListener('dblclick', () => {
          envelope?.deletePoint(index);
        });
      }

      pointsGroup.appendChild(circle);
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.val && selectedPoint.val !== null) {
      const rect = svgElement.getBoundingClientRect();
      const time = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      const value = Math.max(
        0,
        Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
      );
      envelope?.updatePoint(selectedPoint.val, time, value);
    }
  };

  const handleMouseUp = () => {
    isDragging.val = false;
    selectedPoint.val = null;
  };

  const handleDoubleClick = (e: MouseEvent) => {
    if (isDragging.val) return;
    const rect = svgElement.getBoundingClientRect();
    const time = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const value = Math.max(
      0,
      Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
    );
    envelope?.addPoint(time, value);
  };

  // Create SVG
  svgElement = svg({
    viewBox: '0 0 400 200',
    preserveAspectRatio: 'none', // stretches if necessary to maintain correct position relative to mouse
    style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px;`,
  }) as SVGSVGElement;

  svgElement.addEventListener('mousemove', handleMouseMove);
  svgElement.addEventListener('mouseup', handleMouseUp);
  svgElement.addEventListener('mouseleave', handleMouseUp);
  svgElement.addEventListener('dblclick', handleDoubleClick);

  // Grid
  const gridGroup = g(
    { class: 'grid' },
    ...Array.from({ length: 6 }, (_, i) => {
      const x = (i / 5) * 400;
      return line({
        x1: x,
        y1: 0,
        x2: x,
        y2: 200,
        stroke: '#333',
        'stroke-width': 1,
      });
    }),
    ...Array.from({ length: 6 }, (_, i) => {
      const y = (i / 5) * 200;
      return line({
        x1: 0,
        y1: y,
        x2: 400,
        y2: y,
        stroke: '#333',
        'stroke-width': 1,
      });
    })
  );

  // Envelope path
  const envelopePath = path({
    d: () => {
      updateTrigger.val;
      return envelope?.getSVGPath(400, 200);
    },
    fill: 'none',
    stroke: '#4ade80',
    'stroke-width': 2,
  });

  // Control points group
  pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pointsGroup.setAttribute('class', 'control-points');

  // Assemble
  svgElement.appendChild(gridGroup);
  svgElement.appendChild(envelopePath);
  svgElement.appendChild(pointsGroup);

  // Reactivity
  van.derive(() => {
    updateTrigger.val;
    selectedPoint.val;
    updateControlPoints();
  });

  return svgElement;
};

// IGNORE BELOW
// export const EnvelopeSVG = (
//   envelope: CustomEnvelope | null,
//   width: string = '100%',
//   height: string = '120px'
// ) => {
//   if (!envelope) {
//     return div(
//       {
//         style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666;`,
//       },
//       'Loading envelope...'
//     );
//   }

//   const selectedPoint = van.state<number | null>(null);
//   const isDragging = van.state(false);
//   const updateTrigger = van.state(0);

//   const unsubscribe = envelope.onChange(() => {
//     updateTrigger.val++;
//   });

//   const { circle } = van.tags('http://www.w3.org/2000/svg');

//   // Create a container that we can dynamically update
//   const controlPointsContainer = g({ class: 'control-points' });

//   // Function to update control points manually
//   const updateControlPoints = () => {
//     // Clear existing points
//     controlPointsContainer.innerHTML = '';

//     const points = envelope.getPoints() || DEFAULT_ENV;
//     points.forEach((point, index) => {
//       const circleElement = circle({
//         cx: point.time * 400,
//         cy: (1 - point.value) * 200,
//         r: 4,
//         fill: selectedPoint.val === index ? '#ff6b6b' : '#4ade80',
//         stroke: '#fff',
//         'stroke-width': 1,
//         style: 'cursor: pointer;',
//         onmousedown: (e: MouseEvent) => {
//           selectedPoint.val = index;
//           isDragging.val = true;
//           e.preventDefault();
//         },
//         ...(index > 0 &&
//           index < points.length - 1 && {
//             ondblclick: () => envelope.deletePoint(index),
//           }),
//       });

//       van.add(controlPointsContainer, circleElement);
//     });
//   };

//   // Set up reactivity using van.derive
//   van.derive(() => {
//     updateTrigger.val; // Dependency
//     selectedPoint.val; // Dependency
//     updateControlPoints();
//   });

//   return svg(
//     {
//       viewBox: '0 0 400 200',
//       preserveAspectRatio: 'none',
//       style: `width: ${width}; height: ${height}; background: #1a1a1a; border: 1px solid #444; border-radius: 4px;`,
//       onmousemove: (e: MouseEvent) => {
//         if (isDragging.val && selectedPoint.val !== null) {
//           const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
//           const time = Math.max(
//             0,
//             Math.min(1, (e.clientX - rect.left) / rect.width)
//           );
//           const value = Math.max(
//             0,
//             Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
//           );
//           envelope.updatePoint(selectedPoint.val, time, value);
//         }
//       },
//       onmouseup: () => {
//         isDragging.val = false;
//         selectedPoint.val = null;
//       },
//       onmouseleave: () => {
//         isDragging.val = false;
//         selectedPoint.val = null;
//       },
//       ondblclick: (e: MouseEvent) => {
//         if (isDragging.val) return;
//         const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
//         const time = Math.max(
//           0,
//           Math.min(1, (e.clientX - rect.left) / rect.width)
//         );
//         const value = Math.max(
//           0,
//           Math.min(1, 1 - (e.clientY - rect.top) / rect.height)
//         );
//         envelope.addPoint(time, value);
//       },
//     },

//     // Grid
//     g(
//       { class: 'grid' },
//       ...Array.from({ length: 6 }, (_, i) => {
//         const x = (i / 5) * 400;
//         return line({
//           x1: x,
//           y1: 0,
//           x2: x,
//           y2: 200,
//           stroke: '#333',
//           'stroke-width': 1,
//         });
//       }),
//       ...Array.from({ length: 6 }, (_, i) => {
//         const y = (i / 5) * 200;
//         return line({
//           x1: 0,
//           y1: y,
//           x2: 400,
//           y2: y,
//           stroke: '#333',
//           'stroke-width': 1,
//         });
//       })
//     ),

//     // Envelope path
//     path({
//       d: () => {
//         updateTrigger.val;
//         return envelope.getSVGPath(400, 200);
//       },
//       fill: 'none',
//       stroke: '#4ade80',
//       'stroke-width': 2,
//     }),

//     // Control points container
//     controlPointsContainer
//   );
// };
