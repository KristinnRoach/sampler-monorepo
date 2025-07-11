// playheadAnimationManager.ts
import { gsap, MotionPathPlugin, CustomEase } from 'gsap/all';
import { State } from '@repo/vanjs-core';
import { generateMidiNoteColors } from '../../../utils/generateColors';

gsap.registerPlugin(MotionPathPlugin, CustomEase);

export interface AnimationMessage {
  voiceId: number;
  midiNote: number;
  envDurations: Record<string, number>;
  loopEnabled?: Record<string, boolean>;
}

export interface PlayheadManager {
  triggerPlayAnimation: (msg: AnimationMessage, envelopeType: string) => void;
  releaseAnimation: (msg: AnimationMessage) => void;
  refreshPlayingAnimations: () => void;
  hideAllPlayheads: () => void;
  cleanup: () => void;
}

/**
 * Creates a playhead animation manager for envelope visualization
 */
export const Playheads = (
  svgElement: SVGSVGElement,
  envelopePath: SVGPathElement,
  isEnabled: State<boolean>,
  currentDurationSeconds: State<number>,
  currentEase: State<string | null>,
  maxDurationSeconds: State<number>,
  svgWidth: number = 400,
  multiColorPlayheads: boolean = true
): PlayheadManager => {
  const activeTweens: Map<number, gsap.core.Tween> = new Map();
  const playheads: Map<number, SVGCircleElement> = new Map();
  const easeCache = new Map<string, string>();

  // Generate note colors for multi-colored playheads
  let noteColor: string | Record<number, string>;
  if (multiColorPlayheads) {
    noteColor = generateMidiNoteColors('none', [40, 90], true);
  } else {
    noteColor = 'red';
  }

  /**
   * Creates a playhead circle element
   */
  const createPlayhead = (voiceId: number): SVGCircleElement => {
    const circle = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'circle'
    );
    circle.setAttribute('id', `playhead-${voiceId}`);
    circle.setAttribute('cx', '2.5');
    circle.setAttribute('cy', '197.5');
    circle.setAttribute('r', '5');
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('class', 'playhead');
    circle.setAttribute('tabIndex', '-1');
    circle.style.pointerEvents = 'none';
    return circle;
  };

  /**
   * Creates a time-based ease from the envelope path
   */
  const createTimeBasedEase = (pathElement: SVGPathElement): string | null => {
    if (!isEnabled.val) return null;

    const pathData = pathElement.getAttribute('d');
    if (!pathData?.length) return null;

    // Include maxDuration in cache key so ease updates when duration changes
    const cacheKey = `ease-${pathData}-${maxDurationSeconds.val}`;
    if (easeCache.has(cacheKey)) {
      return easeCache.get(cacheKey) || null;
    }

    try {
      const pathLength = pathElement.getTotalLength();
      const numSamples = 50;
      const samples = [];

      // Sample the path by progress (0 to 1)
      for (let i = 0; i <= numSamples; i++) {
        const progress = i / numSamples;
        const distance = progress * pathLength;
        const pt = pathElement.getPointAtLength(distance);
        // Use actual maxDuration and svgWidth for accurate time mapping
        const time =
          ((pt.x / svgWidth) * maxDurationSeconds.val) / maxDurationSeconds.val; // Normalize to [0,1]
        samples.push({ progress, time });
      }

      // For each target time, find the closest sample
      const easePoints = [];
      const numEasePoints = 10;
      for (let i = 0; i <= numEasePoints; i++) {
        const targetTime = i / numEasePoints;
        let closest = samples[0];
        for (const s of samples) {
          if (
            Math.abs(s.time - targetTime) < Math.abs(closest.time - targetTime)
          ) {
            closest = s;
          }
        }
        easePoints.push({ x: targetTime, y: closest.progress });
      }

      // Build the ease path string
      let pathStr = `M${easePoints[0].x},${easePoints[0].y}`;
      for (let i = 1; i < easePoints.length; i++) {
        pathStr += ` L${easePoints[i].x},${easePoints[i].y}`;
      }

      const easeName = `timeCorrection-${Date.now()}-${maxDurationSeconds.val}`;
      CustomEase.create(easeName, pathStr);
      easeCache.set(cacheKey, easeName);

      return easeName;
    } catch (e) {
      console.warn('Failed to create time-based ease:', e);
      return null;
    }
  };

  /**
   * Triggers a playhead animation for a voice
   */
  const triggerPlayAnimation = (
    msg: AnimationMessage,
    envelopeType: string
  ): void => {
    if (!isEnabled.val) return;

    // Kill existing animation for this voice
    if (activeTweens.has(msg.voiceId)) {
      const existing = activeTweens.get(msg.voiceId);
      if (existing && existing.isActive()) {
        existing.kill();
      }
      activeTweens.delete(msg.voiceId);
    }

    // Check if we have duration for this envelope type
    if (!msg.envDurations[envelopeType]) return;

    const envDuration =
      msg.envDurations[envelopeType] ?? currentDurationSeconds.val;

    // Update current duration if needed
    if (currentDurationSeconds.val !== envDuration) {
      currentDurationSeconds.val = envDuration;
    }

    // Create and add playhead
    const playhead = createPlayhead(msg.voiceId);
    svgElement.appendChild(playhead);

    const isLoopingEnv = msg.loopEnabled?.[envelopeType] ?? false;
    const easeToUse = currentEase.val || 'none';
    const color = multiColorPlayheads
      ? (noteColor as Record<number, string>)[msg.midiNote] || 'red'
      : 'red';

    // Create GSAP animation
    const newTween = gsap.to(playhead, {
      id: msg.voiceId,
      motionPath: {
        path: envelopePath,
        align: envelopePath,
        alignOrigin: [0.5, 0.5],
      },
      duration: envDuration,
      repeat: isLoopingEnv ? -1 : 0,
      ease: easeToUse,
      onStart: () => playhead.setAttribute('fill', color),
      onComplete: () => playhead.setAttribute('fill', 'transparent'),
    });

    // Store references
    playheads.set(msg.voiceId, playhead);
    activeTweens.set(msg.voiceId, newTween);
  };

  /**
   * Releases/stops animation for a voice
   */
  const releaseAnimation = (msg: AnimationMessage): void => {
    if (!isEnabled.val) return;

    // Kill the tween
    if (activeTweens.has(msg.voiceId)) {
      const existing = activeTweens.get(msg.voiceId);
      if (existing && existing.isActive()) {
        existing.kill();
      }
      activeTweens.delete(msg.voiceId);
    }

    // Remove the playhead
    if (playheads.has(msg.voiceId)) {
      const head = playheads.get(msg.voiceId);
      if (head && head.parentNode === svgElement) {
        svgElement.removeChild(head);
      }
      playheads.delete(msg.voiceId);
    }
  };

  /**
   * Forces a refresh of the time-based ease (call when path or duration changes)
   */
  const refreshTimeBasedEase = (): void => {
    const newEase = createTimeBasedEase(envelopePath);
    if (newEase !== currentEase.val) {
      currentEase.val = newEase;
    }
  };

  /**
   * Refreshes all currently playing animations (useful when path changes)
   */
  const refreshPlayingAnimations = (): void => {
    if (!isEnabled.val) return;

    // Always refresh the ease when this is called
    refreshTimeBasedEase();

    for (const [voiceId, tween] of activeTweens) {
      if (tween.isActive()) {
        const totalTime = tween.time(); // Capture absolute time
        const tweenDuration = (tween.vars.duration as number) ?? 0;
        const isLoopingEnv = tween.vars.repeat === -1;
        const currentDuration = currentDurationSeconds.val;

        // Check if duration changed for looping animations
        const durationChanged =
          Math.abs(currentDuration - tweenDuration) > 0.001;
        const shouldUpdateDuration = isLoopingEnv && durationChanged;

        // Kill the old tween
        tween.kill();

        const playhead = playheads.get(voiceId);
        if (playhead) {
          // Create new tween with updated path/duration
          const newTween = gsap.to(playhead, {
            motionPath: {
              path: envelopePath, // Always update path
              align: envelopePath,
              alignOrigin: [0.5, 0.5],
            },
            duration: shouldUpdateDuration ? currentDuration : tweenDuration,
            repeat: isLoopingEnv ? -1 : 0,
            ease: currentEase.val || 'none',
            onStart: () => playhead.setAttribute('fill', 'red'),
            onComplete: () => playhead.setAttribute('fill', 'transparent'),
          });

          // Restore absolute time position
          newTween.time(totalTime);
          activeTweens.set(voiceId, newTween);
        }
      }
    }
  };

  /**
   * Hides all playheads (makes them transparent)
   */
  const hideAllPlayheads = (): void => {
    for (const [, playhead] of playheads) {
      playhead.setAttribute('fill', 'transparent');
    }
  };

  /**
   * Cleanup - kills all animations and removes playheads
   */
  const cleanup = (): void => {
    // Kill all tweens
    for (const [, tween] of activeTweens) {
      if (tween.isActive()) {
        tween.kill();
      }
    }
    activeTweens.clear();

    // Remove all playheads
    for (const [, playhead] of playheads) {
      if (playhead && playhead.parentNode === svgElement) {
        svgElement.removeChild(playhead);
      }
    }
    playheads.clear();

    // Clear ease cache
    easeCache.clear();
  };

  return {
    triggerPlayAnimation,
    releaseAnimation,
    refreshPlayingAnimations,
    hideAllPlayheads,
    cleanup,
  };
};

// // playheadAnimationManager.ts
// import { gsap, MotionPathPlugin, CustomEase } from 'gsap/all';
// import { State } from '@repo/vanjs-core';
// import { generateMidiNoteColors } from '../../../utils/generateColors';

// gsap.registerPlugin(MotionPathPlugin, CustomEase);

// export interface AnimationMessage {
//   voiceId: number;
//   midiNote: number;
//   envDurations: Record<string, number>;
//   loopEnabled?: Record<string, boolean>;
// }

// export interface PlayheadManager {
//   triggerPlayAnimation: (msg: AnimationMessage, envelopeType: string) => void;
//   releaseAnimation: (msg: AnimationMessage) => void;
//   refreshPlayingAnimations: () => void;
//   hideAllPlayheads: () => void;
//   cleanup: () => void;
// }

// /**
//  * Creates a playhead animation manager for envelope visualization
//  */
// export const Playheads = (
//   svgElement: SVGSVGElement,
//   envelopePath: SVGPathElement,
//   isEnabled: State<boolean>,
//   currentDurationSeconds: State<number>,
//   currentEase: State<string | null>,
//   multiColorPlayheads: boolean = true
// ): PlayheadManager => {
//   const activeTweens: Map<number, gsap.core.Tween> = new Map();
//   const playheads: Map<number, SVGCircleElement> = new Map();
//   const easeCache = new Map<string, string>();

//   // Generate note colors for multi-colored playheads
//   let noteColor: string | Record<number, string>;
//   if (multiColorPlayheads) {
//     noteColor = generateMidiNoteColors('none', [40, 90], true);
//   } else {
//     noteColor = 'red';
//   }

//   /**
//    * Creates a playhead circle element
//    */
//   const createPlayhead = (voiceId: number): SVGCircleElement => {
//     const circle = document.createElementNS(
//       'http://www.w3.org/2000/svg',
//       'circle'
//     );
//     circle.setAttribute('id', `playhead-${voiceId}`);
//     circle.setAttribute('cx', '2.5');
//     circle.setAttribute('cy', '197.5');
//     circle.setAttribute('r', '5');
//     circle.setAttribute('fill', 'transparent');
//     circle.setAttribute('stroke-width', '2');
//     circle.setAttribute('class', 'playhead');
//     circle.setAttribute('tabIndex', '-1');
//     circle.style.pointerEvents = 'none';
//     return circle;
//   };

//   /**
//    * Creates a time-based ease from the envelope path
//    */
//   const createTimeBasedEase = (pathElement: SVGPathElement): string | null => {
//     if (!isEnabled.val) return null;

//     const pathData = pathElement.getAttribute('d');
//     if (!pathData) return null;

//     const cacheKey = `ease-${pathData}`;
//     if (easeCache.has(cacheKey)) {
//       return easeCache.get(cacheKey) || null;
//     }

//     try {
//       const pathLength = pathElement.getTotalLength();
//       const numSamples = 50;
//       const samples = [];

//       // Sample the path by progress (0 to 1)
//       for (let i = 0; i <= numSamples; i++) {
//         const progress = i / numSamples;
//         const distance = progress * pathLength;
//         const pt = pathElement.getPointAtLength(distance);
//         const time = pt.x / 400; // Map x to [0,1] time (assuming SVG_WIDTH = 400)
//         samples.push({ progress, time });
//       }

//       // For each target time, find the closest sample
//       const easePoints = [];
//       const numEasePoints = 10;
//       for (let i = 0; i <= numEasePoints; i++) {
//         const targetTime = i / numEasePoints;
//         let closest = samples[0];
//         for (const s of samples) {
//           if (
//             Math.abs(s.time - targetTime) < Math.abs(closest.time - targetTime)
//           ) {
//             closest = s;
//           }
//         }
//         easePoints.push({ x: targetTime, y: closest.progress });
//       }

//       // Build the ease path string
//       let pathStr = `M${easePoints[0].x},${easePoints[0].y}`;
//       for (let i = 1; i < easePoints.length; i++) {
//         pathStr += ` L${easePoints[i].x},${easePoints[i].y}`;
//       }

//       const easeName = `timeCorrection-${Date.now()}`;
//       CustomEase.create(easeName, pathStr);
//       easeCache.set(cacheKey, easeName);

//       return easeName;
//     } catch (e) {
//       console.warn('Failed to create time-based ease:', e);
//       return null;
//     }
//   };

//   /**
//    * Triggers a playhead animation for a voice
//    */
//   const triggerPlayAnimation = (
//     msg: AnimationMessage,
//     envelopeType: string
//   ): void => {
//     if (!isEnabled.val) return;

//     // Kill existing animation for this voice
//     if (activeTweens.has(msg.voiceId)) {
//       const existing = activeTweens.get(msg.voiceId);
//       if (existing && existing.isActive()) {
//         existing.kill();
//       }
//       activeTweens.delete(msg.voiceId);
//     }

//     // Check if we have duration for this envelope type
//     if (!msg.envDurations[envelopeType]) return;

//     const envDuration =
//       msg.envDurations[envelopeType] ?? currentDurationSeconds.val;

//     // Update current duration if needed
//     if (currentDurationSeconds.val !== envDuration) {
//       currentDurationSeconds.val = envDuration;
//     }

//     // Create and add playhead
//     const playhead = createPlayhead(msg.voiceId);
//     svgElement.appendChild(playhead);

//     const isLoopingEnv = msg.loopEnabled?.[envelopeType] ?? false;
//     const easeToUse = currentEase.val || 'none';
//     const color = multiColorPlayheads
//       ? (noteColor as Record<number, string>)[msg.midiNote] || 'red'
//       : 'red';

//     // Create GSAP animation
//     const newTween = gsap.to(playhead, {
//       id: msg.voiceId,
//       motionPath: {
//         path: envelopePath,
//         align: envelopePath,
//         alignOrigin: [0.5, 0.5],
//       },
//       duration: envDuration,
//       repeat: isLoopingEnv ? -1 : 0,
//       ease: easeToUse,
//       onStart: () => playhead.setAttribute('fill', color),
//       onComplete: () => playhead.setAttribute('fill', 'transparent'),
//     });

//     // Store references
//     playheads.set(msg.voiceId, playhead);
//     activeTweens.set(msg.voiceId, newTween);
//   };

//   /**
//    * Releases/stops animation for a voice
//    */
//   const releaseAnimation = (msg: AnimationMessage): void => {
//     if (!isEnabled.val) return;

//     // Kill the tween
//     if (activeTweens.has(msg.voiceId)) {
//       const existing = activeTweens.get(msg.voiceId);
//       if (existing && existing.isActive()) {
//         existing.kill();
//       }
//       activeTweens.delete(msg.voiceId);
//     }

//     // Remove the playhead
//     if (playheads.has(msg.voiceId)) {
//       const head = playheads.get(msg.voiceId);
//       if (head && head.parentNode === svgElement) {
//         svgElement.removeChild(head);
//       }
//       playheads.delete(msg.voiceId);
//     }
//   };

//   /**
//    * Refreshes all currently playing animations (useful when path changes)
//    */
//   const refreshPlayingAnimations = (): void => {
//     if (!isEnabled.val) return;

//     // Update the current ease based on the path
//     const newEase = createTimeBasedEase(envelopePath);
//     if (newEase !== currentEase.val) {
//       currentEase.val = newEase;
//     }

//     for (const [voiceId, tween] of activeTweens) {
//       if (tween.isActive()) {
//         const totalTime = tween.time(); // Capture absolute time
//         const tweenDuration = (tween.vars.duration as number) ?? 0;
//         const isLoopingEnv = tween.vars.repeat === -1;
//         const currentDuration = currentDurationSeconds.val;

//         // Check if duration changed for looping animations
//         const durationChanged =
//           Math.abs(currentDuration - tweenDuration) > 0.001;
//         const shouldUpdateDuration = isLoopingEnv && durationChanged;

//         // Kill the old tween
//         tween.kill();

//         const playhead = playheads.get(voiceId);
//         if (playhead) {
//           // Create new tween with updated path/duration
//           const newTween = gsap.to(playhead, {
//             motionPath: {
//               path: envelopePath, // Always update path
//               align: envelopePath,
//               alignOrigin: [0.5, 0.5],
//             },
//             duration: shouldUpdateDuration ? currentDuration : tweenDuration,
//             repeat: isLoopingEnv ? -1 : 0,
//             ease: currentEase.val || 'none',
//             onStart: () => playhead.setAttribute('fill', 'red'),
//             onComplete: () => playhead.setAttribute('fill', 'transparent'),
//           });

//           // Restore absolute time position
//           newTween.time(totalTime);
//           activeTweens.set(voiceId, newTween);
//         }
//       }
//     }
//   };

//   /**
//    * Hides all playheads (makes them transparent)
//    */
//   const hideAllPlayheads = (): void => {
//     for (const [, playhead] of playheads) {
//       playhead.setAttribute('fill', 'transparent');
//     }
//   };

//   /**
//    * Cleanup - kills all animations and removes playheads
//    */
//   const cleanup = (): void => {
//     // Kill all tweens
//     for (const [, tween] of activeTweens) {
//       if (tween.isActive()) {
//         tween.kill();
//       }
//     }
//     activeTweens.clear();

//     // Remove all playheads
//     for (const [, playhead] of playheads) {
//       if (playhead && playhead.parentNode === svgElement) {
//         svgElement.removeChild(playhead);
//       }
//     }
//     playheads.clear();

//     // Clear ease cache
//     easeCache.clear();
//   };

//   return {
//     triggerPlayAnimation,
//     releaseAnimation,
//     refreshPlayingAnimations,
//     hideAllPlayheads,
//     cleanup,
//   };
// };
