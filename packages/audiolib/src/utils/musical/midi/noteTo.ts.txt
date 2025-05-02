type Octave = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type NoteName =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';
type Note = `${NoteName}${Octave}`;

type C_Major = [
  `C${Octave}`,
  `D${Octave}`,
  `E${Octave}`,
  `F${Octave}`,
  `G${Octave}`,
  `A${Octave}`,
  `B${Octave}`,
];

export const C5_DURATION_SEC = 0.00191117077819399; // C5 loop length in seconds

const C0_DURATION_MS = 61.1620795107034; // C0 loop length in ms
const SEMITONE_RATIO = 2 ** (1 / 12);

const noteDurations: Record<NoteName, number> = {
  C: C0_DURATION_MS,
  'C#': C0_DURATION_MS / SEMITONE_RATIO,
  D: C0_DURATION_MS / SEMITONE_RATIO ** 2,
  'D#': C0_DURATION_MS / SEMITONE_RATIO ** 3,
  E: C0_DURATION_MS / SEMITONE_RATIO ** 4,
  F: C0_DURATION_MS / SEMITONE_RATIO ** 5,
  'F#': C0_DURATION_MS / SEMITONE_RATIO ** 6,
  G: C0_DURATION_MS / SEMITONE_RATIO ** 7,
  'G#': C0_DURATION_MS / SEMITONE_RATIO ** 8,
  A: C0_DURATION_MS / SEMITONE_RATIO ** 9,
  'A#': C0_DURATION_MS / SEMITONE_RATIO ** 10,
  B: C0_DURATION_MS / SEMITONE_RATIO ** 11,
};

function getNoteDuration(
  noteName: NoteName,
  octave: number,
  timeUnit: 'ms' | 'sec' = 'ms'
): number {
  const baseDuration = noteDurations[noteName];
  if (baseDuration === undefined)
    throw new Error(`Invalid note name: ${noteName}`);
  if (timeUnit === 'ms') return baseDuration / 2 ** octave;
  return baseDuration / 2 ** octave / 1000;
}

export function snapDurationToNote(
  duration: number,
  scale: NoteName[],
  lowestNoteName: NoteName = 'C',
  highestNoteName: NoteName = 'C',
  lowestOctave: number = 1,
  highestOctave: number = 6,
  timeUnit: 'ms' | 'sec' = 'ms'
): number {
  if (lowestOctave > highestOctave) {
    console.error('lowestOctave must be less than or equal to highestOctave');
    return duration;
  }

  if (!scale.includes(lowestNoteName) || !scale.includes(highestNoteName)) {
    console.error('lowestNoteName and highestNoteName must be in the scale');
    return duration;
  }

  const lowestDuration = getNoteDuration(
    lowestNoteName,
    lowestOctave,
    timeUnit
  );

  const highestDuration = getNoteDuration(
    highestNoteName,
    highestOctave,
    timeUnit
  );

  if (duration >= lowestDuration) return duration;
  if (duration <= highestDuration) return highestDuration;

  let closestDuration = lowestDuration;
  let smallestDifference = Math.abs(duration - lowestDuration);

  for (let oct = lowestOctave; oct <= highestOctave; oct++) {
    // if the highest octave, limit to highest note parameter
    const octavesLimited =
      oct === highestOctave
        ? scale.slice(0, scale.indexOf(highestNoteName) + 1)
        : scale;

    for (const note of octavesLimited) {
      const noteDuration = getNoteDuration(note, oct, timeUnit);
      if (noteDuration < duration) continue; // We've passed the target length

      const difference = Math.abs(duration - noteDuration);

      if (difference < smallestDifference) {
        smallestDifference = difference;
        closestDuration = noteDuration;
      }
    }
  }
  return closestDuration;
}

// example usage
// const zeroSnapLength = end - start;

// this.updateLoopPoints(start, end);

// if (zeroSnapLength > 0.015) return;

// // Snap to notes when in audiorange
// const snappedLength = snapDurationToNote(
//   zeroSnapLength,
//   ['C'], // Available: C, 'D', 'E', 'F', 'G', 'A', 'B'
//   'C',
//   'C',
//   0,
//   7,
//   'sec' // sec, ms or samples
// );
// const newEnd = start + snappedLength;

// this.source.loopEnd = newEnd;

type noteToDuration_map = {
  [K in Note]?: number;
};

export const msToC: noteToDuration_map = {
  C0: 61.1620795107034,
  C1: 30.5810397553517,
  C2: 15.2881816237577,
  C3: 7.64468311290726,
  C4: 3.82234155638498,
  C5: 1.91117077819399,
  C6: 0.955585389097005,
  C7: 0.477792694455503,
};

export const secToC: noteToDuration_map = {
  C0: 0.0611620795107034,
  C1: 0.0305810397553517,
  C2: 0.0152881816237577,
  C3: 0.00764468311290726,
  C4: 0.00382234155638498,
  C5: 0.00191117077819399,
  C6: 0.000955585389097005,
  C7: 0.000477792694455503,
};

export const secToC3major: noteToDuration_map = {
  C3: 0.00764468311290726,
  D3: 0.00680364273366824,
  E3: 0.0060625,
  F3: 0.00571578947368421,
  G3: 0.00509259259259259,
  A3: 0.00453514739229025,
  B3: 0.00404040404040404,
};

export const secToC4major: noteToDuration_map = {
  C4: 0.00382234155638498,
  D4: 0.00340182136683417,
  E4: 0.00303125,
  F4: 0.00285789473684211,
  G4: 0.0025462962962963,
  A4: 0.00226757369614512,
  B4: 0.00202020202020202,
};

export const secToCorG: noteToDuration_map = {
  C0: 0.0611620795107034,
  G0: 0.0549090909090909,
  C1: 0.0305810397553517,
  G1: 0.0274545454545455,
  C2: 0.0152881816237577,
  G2: 0.0137272727272727,
  C3: 0.00764468311290726,
  G3: 0.00686363636363636,
  C4: 0.00382234155638498,
  G4: 0.00343181818181818,
  C5: 0.00191117077819399,
  G5: 0.00171590909090909,
  C6: 0.000955585389097005,
  G6: 0.000857954545454545,
  C7: 0.000477792694455503,
  G7: 0.000428977272727273,
};
