import { CustomEnvelope, EnvelopeType, SamplePlayer } from '@repo/audiolib';
import { generateMidiNoteColors } from '../../../utils/generateColors';
import { gsap, MotionPathPlugin, CustomEase } from 'gsap/all';

gsap.registerPlugin(MotionPathPlugin, CustomEase);

export interface PlayheadManager {
  cleanup: () => void;
}

export const createPlayheads = (
  svgElement: SVGSVGElement,
  pointsGroup: SVGGElement,
  envelope: CustomEnvelope,
  instrument: SamplePlayer,
  envType: EnvelopeType,
  svgWidth: number = 400,
  svgHeight: number = 200
): PlayheadManager => {
  const activeAnimations = new Map<string, gsap.core.Timeline>();
  const activeLoopingAnimations = new Map<string, gsap.core.Timeline>();
  const activeExitAnimations = new Map<string, gsap.core.Timeline>();

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

  // Listen to envelope messages
  instrument.onMessage(`${envType}:trigger`, (msg: any) => {
    if (!msg.voiceId) return;

    const {
      voiceId,
      midiNote = 60,
      duration,
      sustainEnabled,
      loopEnabled,
      sustainPoint,
      releasePoint,
    } = msg; // curveData

    // Let looping envelopes continue
    if (loopEnabled && activeAnimations.has(voiceId)) return;

    // Stop any existing animation before creating new one
    if (activeAnimations.has(voiceId)) {
      stopAnimation(voiceId);
    }

    const playhead = createPlayhead(voiceId, midiNote);
    svgElement.appendChild(playhead);
    playheads.set(voiceId, playhead);

    gsap.set(playhead, { x: 0, y: centerY }); // init pos

    const triggerTl = gsap.timeline();

    if (duration > 0.3) triggerTl.add(entryTween(playhead), 0);

    const safeDuration = Math.max(0.3, duration);

    if (loopEnabled) {
      // Create single loop animation // (could use tween instead of timeline)
      triggerTl.to(
        playhead,
        {
          x: svgWidth,
          duration: duration,
          ease: 'none',
          onComplete: () => {
            // For loops, don't auto-cleanup since restart() will handle it
            // Only cleanup on explicit release:loop message
          },
          // paused: true, // Start paused, will be played by loop messages
        },
        0
      );

      activeLoopingAnimations.set(voiceId, triggerTl);
      triggerTl.play();
    } else if (sustainEnabled) {
      // Calculate sustain point x position
      const sustainX = (sustainPoint.time / envelope.fullDuration) * svgWidth;

      // Phase 1: Animate to sustain point
      triggerTl.to(
        playhead,
        {
          x: sustainX,
          duration: safeDuration,
          ease: 'none',
          onComplete: () => {
            triggerTl.pause(); // Wait for release
          },
        },
        0
      );
    } else {
      // No sustain: animate straight to end
      triggerTl.to(
        playhead,
        {
          x: svgWidth,
          duration: safeDuration,
          ease: 'none',
        },
        0
      );
    }

    activeAnimations.set(voiceId, triggerTl);
  });

  // Loop iteration handler
  instrument.onMessage(`${envType}:trigger:loop`, (msg: any) => {
    if (!msg.voiceId || !activeLoopingAnimations.has(msg.voiceId)) return;

    const loopTl = activeLoopingAnimations.get(msg.voiceId);
    if (loopTl) {
      loopTl.restart(); // Restart the animation
    }
  });

  instrument.onMessage(`${envType}:release`, (msg: any) => {
    const { voiceId, remainingDuration, releasePoint } = msg;
    if (!voiceId || !remainingDuration || !releasePoint) return;

    // Handle looping animations
    if (activeLoopingAnimations.has(voiceId)) {
      const loopTl = activeLoopingAnimations.get(voiceId);
      loopTl?.kill();
      activeLoopingAnimations.delete(voiceId);
      // continues to release animation
    }

    if (!activeAnimations.has(voiceId)) return;

    const triggerTl = activeAnimations.get(voiceId);
    const playhead = playheads.get(voiceId);

    if (triggerTl && playhead) {
      // Jump to release point x position
      const releaseX = releasePoint.normalizedTime * svgWidth;

      gsap.set(playhead, { x: releaseX });
      gsap.set(playhead, { opacity: 0.7 });

      triggerTl.kill();
      const releaseTl = gsap.timeline();

      // Phase 2: Continue from release point to end
      releaseTl
        .to(playhead, {
          x: svgWidth,
          duration: remainingDuration,
          ease: 'none',
          onComplete: () => stopAnimation(voiceId),
        })
        .to(
          // exitTween
          playhead,
          {
            r: 0,
            strokeWidth: 0,
            opacity: 0.1,
            duration: Math.min(0.2, remainingDuration - 0.2),
          },
          remainingDuration - 0.2
        );

      activeAnimations.set(voiceId, releaseTl);
    }
  });

  const stopAnimation = (voiceId: string) => {
    activeLoopingAnimations.delete(voiceId);

    if (activeExitAnimations.has(voiceId)) {
      // Kill existing exit animation to prevent conflicts
      const exitTl = activeExitAnimations.get(voiceId);
      exitTl?.kill();
      activeExitAnimations.delete(voiceId);
    }

    if (!activeAnimations.has(voiceId)) return;

    const tl = activeAnimations.get(voiceId);
    const playhead = playheads.get(voiceId);

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
          activeExitAnimations.delete(voiceId);
          exitTl.kill();
        },
      });

      activeExitAnimations.set(voiceId, exitTl);

      exitTl.to(playhead, {
        r: 0,
        strokeWidth: 0,
        duration: 0.2,
        ease: 'none',
        opacity: 0.1,
      });
    }
  };

  instrument.onMessage('voice:stopped', (msg: any) => {
    stopAnimation(msg.voiceId);
  });

  return {
    cleanup: () => {
      [...activeAnimations.keys()].forEach(stopAnimation);
      [...activeLoopingAnimations.values()].forEach((tl) => tl.kill());
      [...activeExitAnimations.values()].forEach((tl) => tl.kill());

      activeAnimations.clear();
      activeLoopingAnimations.clear();
      activeExitAnimations.clear();
      playheads.clear();
    },
  };
};
