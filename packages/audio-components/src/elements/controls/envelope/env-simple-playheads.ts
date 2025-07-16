import { CustomEnvelope, EnvelopeType, SamplePlayer } from '@repo/audiolib';
import { generateMidiNoteColors } from '../../../utils/generateColors';
import { gsap, MotionPathPlugin, CustomEase } from 'gsap/all';

gsap.registerPlugin(MotionPathPlugin, CustomEase);

export interface PlayheadManager {
  cleanup: () => void;
}

export const createSimplePlayheads = (
  svgElement: SVGSVGElement,
  pointsGroup: SVGGElement,
  envelope: CustomEnvelope,
  instrument: SamplePlayer,
  envType: EnvelopeType,
  svgWidth: number = 400,
  svgHeight: number = 200
): PlayheadManager => {
  const activeAnimations = new Map<string, gsap.core.Timeline>();
  const playheads = new Map<string, SVGCircleElement>();

  const colors = generateMidiNoteColors('none', [40, 90], true);

  const centerY = svgHeight / 2;

  // Create playhead element
  const createPlayhead = (
    voiceId: string,
    midiNote: number
  ): SVGCircleElement => {
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    circle.setAttribute('fill', colors[midiNote]);
    circle.setAttribute('pointer-events', 'none'); // SVG attribute
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '1');
    circle.style.pointerEvents = 'none';
    return circle;
  };

  const entryTween = (playhead: SVGCircleElement) =>
    gsap.fromTo(
      playhead,
      {
        r: 0,
        strokeWidth: 0,
        opacity: 0,
      },
      {
        r: 5,
        strokeWidth: 1,
        opacity: 1,
        duration: 0.2,
      }
    );

  //   const exitTween = (playhead: SVGCircleElement) =>
  //     entryTween(playhead).reverse();

  // Listen to envelope messages
  instrument.onMessage(`${envType}:trigger`, (msg: any) => {
    if (!msg.voiceId) return;

    const { voiceId, midiNote = 60, duration, sustainEnabled } = msg; // curveData

    stopAnimation(voiceId);

    const playhead = createPlayhead(voiceId, midiNote);
    svgElement.appendChild(playhead);
    playheads.set(voiceId, playhead);

    gsap.set(playhead, { x: 0, y: centerY }); // init pos

    const tl = gsap.timeline();
    tl.add(entryTween(playhead), 0);

    if (sustainEnabled && envelope.sustainPointIndex !== null) {
      // Calculate sustain point x position
      const sustainPoint = envelope.points[envelope.sustainPointIndex];
      const sustainX = (sustainPoint.time / envelope.fullDuration) * svgWidth;

      // Phase 1: Animate to sustain point
      tl.to(
        playhead,
        {
          x: sustainX,
          // r: curveData
          //   ? () => {
          //       const progress = tl.progress(); // Use timeline reference instead of 'this'
          //       const index = Math.floor(progress * (curveData.length - 1));
          //       return 5 + (curveData[index] || 0) * 10;
          //     }
          //   : 5,
          duration: duration,
          ease: 'none',
          onComplete: () => {
            tl.pause(); // Wait for release
          },
        },
        0
      );
    } else {
      // No sustain: animate straight to end
      tl.to(
        playhead,
        {
          x: svgWidth,
          // r: curveData
          //   ? () => {
          //       const progress = tl.progress(); // Use timeline reference instead of 'this'
          //       const index = Math.floor(progress * (curveData.length - 1));
          //       return 5 + (curveData[index] || 0) * 10;
          //     }
          //   : 5,
          duration: duration,
          ease: 'none',
          onComplete: () => {
            stopAnimation(voiceId);
          },
        },
        0
      );
    }

    tl.to(playhead, { r: 0, opacity: 0, duration: 0.2 });

    activeAnimations.set(voiceId, tl);
  });

  instrument.onMessage(`${envType}:release`, (msg: any) => {
    if (!msg.voiceId) return;

    const tl = activeAnimations.get(msg.voiceId);
    const playhead = playheads.get(msg.voiceId);

    if (tl && playhead) {
      // Jump to release point x position
      const releasePoint = envelope.points[envelope.releasePointIndex];
      const releaseX = (releasePoint.time / envelope.fullDuration) * svgWidth;
      // const releaseX = msg.releasePointTime * svgWidth; // should be the same, check later

      gsap.set(playhead, { x: releaseX });
      gsap.set(playhead, { opacity: 0.7 });

      // Kill current animation and start release phase
      tl.kill();
      const newTl = gsap.timeline();

      // Phase 2: Continue from release point to end
      newTl
        .to(playhead, {
          x: svgWidth,
          duration: msg.remainingDuration,
          ease: 'none',
          onComplete: () => stopAnimation(msg.voiceId),
        })
        .to(
          // exitTween
          playhead,
          {
            r: 0,
            strokeWidth: 0,
            opacity: 0.1,
            duration: Math.min(0.2, msg.remainingDuration - 0.2),
          },
          msg.remainingDuration - 0.2
        );

      activeAnimations.set(msg.voiceId, newTl);
    }
  });

  const stopAnimation = (voiceId: string) => {
    const tl = activeAnimations.get(voiceId);
    const playhead = playheads.get(voiceId);
    const wasPaused = tl?.paused() ?? false;

    if (tl) {
      tl.kill();
      activeAnimations.delete(voiceId);
    }

    if (playhead && playhead.parentNode === svgElement) {
      const exitTl = gsap.timeline({
        onComplete: () => {
          if (playhead.parentNode === svgElement) {
            svgElement.removeChild(playhead);
          }
          playheads.delete(voiceId);
          exitTl.kill();
        },
      });

      exitTl.to(playhead, {
        r: 0,
        x: wasPaused ? '+=0' : '+=20',
        strokeWidth: 0,
        duration: 0.2,
        ease: 'none',
      });
    }
  };
  instrument.onMessage('voice:stopped', (msg: any) => {
    stopAnimation(msg.voiceId);
  });

  return {
    cleanup: () => {
      [...activeAnimations.keys()].forEach(stopAnimation);
    },
  };
};
