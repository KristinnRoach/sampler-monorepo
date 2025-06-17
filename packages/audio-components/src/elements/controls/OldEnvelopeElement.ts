import van from '@repo/vanjs-core';
import type { State } from '@repo/vanjs-core';

const { div, canvas } = van.tags;

type Point = { x: number; y: number; type: string };
type DragPoint = { index: number; point: Point; type: string } | null;

// Accept external states as props
export function DraggableEnvelopeControl(
  attackState: State<number>,
  releaseState: State<number>
) {
  // Use external states
  const attack = attackState;
  const release = releaseState;

  // Placeholders - not connected to audio yet
  const decay = van.state(0.2);
  const sustain = van.state(0.7);

  let isDragging = false;
  let dragPoint: DragPoint = null;
  let controlPoints: Point[] = [];

  const canvasElement = canvas({
    width: '288',
    height: '100',
    style: `
      display: block;
      width: 100%;
      height: 100px;
      border: 1px solid #ccc;
      background: white;
      cursor: crosshair;
    `,
  });

  const calculateControlPoints = (): Point[] => {
    const width = 288;
    const height = 80;
    const sustainWidth = 60;
    const padding = 3; // Visual padding only

    // const attackWidth = Math.max(padding, (attack.val / 1.0) * (width * 0.3));
    const attackWidth = Math.max(0, (attack.val / 1.0) * (width * 0.3));
    const decayWidth = Math.max(0, (decay.val / 1.0) * (width * 0.3));

    // const attackX = attackWidth;
    // const decayX = attackWidth + decayWidth;
    const attackX = attackWidth + padding; // Add padding to visual position
    const decayX = attackWidth + decayWidth + padding; // Maintain relative spacing
    const sustainEndX = Math.min(width - 50, decayX + sustainWidth);

    const availableReleaseWidth = width - sustainEndX - 10;
    const releaseWidth = Math.max(
      0,
      (release.val / 1.0) * availableReleaseWidth
    );
    const releaseX = Math.min(width - 10, sustainEndX + releaseWidth);

    const sustainY = height * (1 - sustain.val) + 10;

    return [
      { x: padding, y: height, type: 'start' }, // Start point with padding
      { x: attackX, y: 10, type: 'attack' },
      { x: decayX, y: sustainY, type: 'decay' },
      { x: sustainEndX, y: sustainY, type: 'sustain' },
      { x: releaseX, y: height, type: 'release' },
    ];
  };

  const getHoveredPoint = (mouseX: number, mouseY: number): DragPoint => {
    const points = calculateControlPoints();
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      const distance = Math.sqrt(
        Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2)
      );
      if (distance <= 10) {
        return { index: i, point, type: point.type };
      }
    }
    return null;
  };

  const updateFromDrag = (pointType: string, newX: number, newY: number) => {
    const width = 288;
    const height = 80;

    newY = Math.max(10, Math.min(height, newY));

    if (pointType === 'attack') {
      newX = Math.max(0, Math.min(width * 0.4, newX));
      attack.val = Math.max(0, Math.min(1.0, (newX / (width * 0.3)) * 1.0));
    } else if (pointType === 'decay') {
      const currentAttackWidth = Math.max(
        0,
        (attack.val / 1.0) * (width * 0.3)
      );
      newX = Math.max(currentAttackWidth + 15, Math.min(width * 0.7, newX));
      const decayWidth = newX - currentAttackWidth;
      decay.val = Math.max(
        0.01,
        Math.min(1.0, (decayWidth / (width * 0.3)) * 1.0)
      );
      sustain.val = Math.max(0, Math.min(1, 1 - (newY - 10) / height));
    } else if (pointType === 'sustain') {
      sustain.val = Math.max(0, Math.min(1, 1 - (newY - 10) / height));
    } else if (pointType === 'release') {
      const sustainWidth = 60;
      const currentAttackWidth = Math.max(
        0,
        (attack.val / 1.0) * (width * 0.3)
      );
      const currentDecayWidth = Math.max(15, (decay.val / 1.0) * (width * 0.3));
      const releaseStart =
        currentAttackWidth + currentDecayWidth + sustainWidth;

      newX = Math.max(releaseStart, Math.min(width - 10, newX));
      const releaseWidth = newX - releaseStart;
      const maxReleaseWidth = width - releaseStart - 10;
      release.val = Math.max(
        0.01,
        Math.min(1.0, (releaseWidth / maxReleaseWidth) * 1.0)
      );
    }

    drawEnvelope();
  };

  const drawEnvelope = () => {
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    const width = 288;
    const height = 100;

    ctx.clearRect(0, 0, width, height);
    controlPoints = calculateControlPoints();

    // Grid lines
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const y = (height * i) / 4;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Envelope line
    ctx.beginPath();
    ctx.moveTo(controlPoints[0].x, controlPoints[0].y);
    for (let i = 1; i < controlPoints.length; i++) {
      ctx.lineTo(controlPoints[i].x, controlPoints[i].y);
    }
    ctx.strokeStyle = '#2c7be5';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Control points
    for (let i = 1; i < controlPoints.length; i++) {
      const point = controlPoints[i];
      ctx.beginPath();
      ctx.arc(point.x, point.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = point.type === 'sustain' ? '#ff6b6b' : '#2c7be5';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '11px Arial';
    const labelY = height - 5;
    ctx.fillText('A', Math.max(0, controlPoints[1].x - 5), labelY);
    ctx.fillText('D', Math.max(0, controlPoints[2].x - 5), labelY);
    ctx.fillText('S', Math.max(0, controlPoints[3].x - 5), labelY);
    ctx.fillText('R', Math.max(0, controlPoints[4].x - 5), labelY);
  };

  const handleMouseDown = (e: MouseEvent) => {
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const hoveredPoint = getHoveredPoint(mouseX, mouseY);
    if (hoveredPoint) {
      isDragging = true;
      dragPoint = hoveredPoint;
      canvasElement.style.cursor = 'grabbing';

      // Prevent parent dragging
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    const rect = canvasElement.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging && dragPoint) {
      updateFromDrag(dragPoint.type, mouseX, mouseY);
      // Prevent parent dragging during envelope interaction
      e.preventDefault();
      e.stopPropagation();
    } else {
      const hoveredPoint = getHoveredPoint(mouseX, mouseY);
      canvasElement.style.cursor = hoveredPoint ? 'grab' : 'crosshair';
    }
  };

  const handleMouseUp = () => {
    isDragging = false;
    dragPoint = null;
    canvasElement.style.cursor = 'crosshair';
  };

  canvasElement.addEventListener('mousedown', handleMouseDown);
  canvasElement.addEventListener('mousemove', handleMouseMove);
  canvasElement.addEventListener('mouseup', handleMouseUp);
  // canvasElement.addEventListener('mouseleave', handleMouseUp); // ?
  document.addEventListener('mouseup', handleMouseUp);

  const resizeObserver = new ResizeObserver(() => {
    setTimeout(drawEnvelope, 10);
  });
  resizeObserver.observe(canvasElement);

  setTimeout(drawEnvelope, 50);

  return div(
    {
      class: 'envelope-control',
      style: `
      display: block;
      background: #f5f5f5;
      border-radius: 8px;
      padding: 16px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      margin: 20px auto;
      touch-action: none; /* Prevent touch scrolling/dragging */
      user-select: none;  /* Prevent text selection */
    `,
    },
    canvasElement
  );
}

export const getADSRValues = () => ({
  attack: 0.1,
  decay: 0.2,
  sustain: 0.7,
  release: 0.3,
});

// div(
//   {
//     class: 'values-display',
//     style: `
//       display: flex;
//       justify-content: space-between;
//       margin-top: 8px;
//       font-size: 12px;
//       color: #666;
//     `,
//   },
//   div(() => `A: ${attack.val.toFixed(2)}`),
//   div(() => `D: ${decay.val.toFixed(2)}`),
//   div(() => `S: ${sustain.val.toFixed(2)}`),
//   div(() => `R: ${release.val.toFixed(2)}`)
// ),
// div(
//   {
//     class: 'instruction',
//     style: `
//       text-align: center;
//       font-size: 11px;
//       color: #888;
//       margin-top: 4px;
//     `,
//   },
//   'Drag the control points to adjust the envelope'
// )
