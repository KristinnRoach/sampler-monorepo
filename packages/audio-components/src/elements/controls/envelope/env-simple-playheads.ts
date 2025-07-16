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
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', colors[midiNote]);
    circle.setAttribute('stroke', '#fff');
    circle.setAttribute('stroke-width', '2');
    circle.style.pointerEvents = 'none';
    return circle;
  };

  // Listen to envelope messages
  const unsubscribe = instrument.onMessage(`${envType}:trigger`, (msg) => {
    if (!msg.voiceId) return;

    const { voiceId, midiNote = 60, duration, sustainEnabled } = msg; // curveData

    // Clean up existing animation
    stopAnimation(voiceId);

    // Create new playhead
    const playhead = createPlayhead(voiceId, midiNote);
    svgElement.appendChild(playhead);
    playheads.set(voiceId, playhead);

    // Set initial position at center left
    gsap.set(playhead, { x: 0, y: centerY });

    const tl = gsap.timeline();

    if (sustainEnabled && envelope.sustainPointIndex !== null) {
      // Calculate sustain point x position
      const sustainPoint = envelope.points[envelope.sustainPointIndex];
      const sustainX = (sustainPoint.time / envelope.fullDuration) * svgWidth;

      // Phase 1: Animate to sustain point
      tl.to(playhead, {
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
      });

      // Phase 2: Continue from release point to end
      const releasePoint = envelope.points[envelope.releasePointIndex];
      const releaseX = (releasePoint.time / envelope.fullDuration) * svgWidth;

      tl.to(playhead, {
        x: svgWidth,
        r: 5, // Will be updated with release curve data

        duration: envelope.releaseTime,
        ease: 'none',
        onComplete: () => {
          stopAnimation(voiceId);
        },
      });
    } else {
      // No sustain: animate straight to end
      tl.to(playhead, {
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
      });
    }

    activeAnimations.set(voiceId, tl);
  });

  const unsubscribeRelease = instrument.onMessage(
    `${envType}:release`,
    (msg) => {
      if (!msg.voiceId) return;

      const tl = activeAnimations.get(msg.voiceId);
      const playhead = playheads.get(msg.voiceId);

      if (tl && playhead) {
        // Dim the playhead for release phase
        gsap.set(playhead, { opacity: 0.75 });

        // Jump to release point x position
        const releasePoint = envelope.points[envelope.releasePointIndex];
        const releaseX = (releasePoint.time / envelope.fullDuration) * svgWidth;
        // const releaseX = msg.releasePointTime * svgWidth; // should be the same, check later

        gsap.set(playhead, { x: releaseX });

        // Kill current animation and start release phase
        tl.kill();
        const newTl = gsap.timeline();
        newTl.to(playhead, {
          x: svgWidth,
          opacity: 0.1,
          //   r: msg.curveData
          //     ? () => {
          //         const progress = newTl.progress(); // Use timeline reference instead of 'this'
          //         const index = Math.floor(progress * (msg.curveData.length - 1));
          //         return 5 + (msg.curveData[index] || 0) * 10;
          //       }
          //     : 5,
          duration: msg.remainingDuration,
          ease: 'none',
          onComplete: () => stopAnimation(msg.voiceId),
        });
        activeAnimations.set(msg.voiceId, newTl);
      }
    }
  );

  const stopAnimation = (voiceId: string) => {
    const tl = activeAnimations.get(voiceId);
    const playhead = playheads.get(voiceId);

    if (tl) {
      tl.kill();
      activeAnimations.delete(voiceId);
    }

    if (playhead && playhead.parentNode === svgElement) {
      svgElement.removeChild(playhead);
      playheads.delete(voiceId);
    }
  };

  return {
    cleanup: () => {
      unsubscribe();
      unsubscribeRelease();
      [...activeAnimations.keys()].forEach(stopAnimation);
    },
  };
};
