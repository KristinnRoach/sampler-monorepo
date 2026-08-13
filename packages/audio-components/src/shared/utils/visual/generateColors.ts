export function generateMidiNoteColors(
  exclude: 'r' | 'g' | 'b' | 'none' = 'none',
  clampBrightnessRange: [number, number] = [20, 80],
  avoidMuddy: boolean = true
): Record<number, string> {
  const colors: Record<number, string> = {};

  for (let midi = 0; midi <= 127; midi++) {
    const hue = (midi % 12) * 30;
    const s = avoidMuddy ? 85 : 70;
    const l =
      clampBrightnessRange[0] +
      ((midi % 12) / 11) * (clampBrightnessRange[1] - clampBrightnessRange[0]);

    const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
    const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
    const m = l / 100 - c / 2;

    let r = 0,
      g = 0,
      b = 0;
    if (hue < 60) {
      r = c;
      g = x;
    } else if (hue < 120) {
      r = x;
      g = c;
    } else if (hue < 180) {
      g = c;
      b = x;
    } else if (hue < 240) {
      g = x;
      b = c;
    } else if (hue < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    if (exclude === 'r') r = 0;
    else if (exclude === 'g') g = 0;
    else if (exclude === 'b') b = 0;

    const toHex = (n: number) =>
      Math.round(Math.max(0, Math.min(255, (n + m) * 255)))
        .toString(16)
        .padStart(2, '0');

    if (avoidMuddy) {
      // Ensure final RGB values have sufficient brightness and separation
      let [rFinal, gFinal, bFinal] = [r + m, g + m, b + m];
      const minBrightness = Math.max(
        (clampBrightnessRange[0] / 100) * 0.8,
        0.3
      );

      if (Math.max(rFinal, gFinal, bFinal) < minBrightness) {
        const scale = minBrightness / Math.max(rFinal, gFinal, bFinal);
        rFinal *= scale;
        gFinal *= scale;
        bFinal *= scale;
      }

      colors[midi] = `#${Math.round(rFinal * 255)
        .toString(16)
        .padStart(2, '0')}${Math.round(gFinal * 255)
        .toString(16)
        .padStart(2, '0')}${Math.round(bFinal * 255)
        .toString(16)
        .padStart(2, '0')}`;
    } else {
      colors[midi] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
  }

  return colors;
}
// export function generateMidiNoteColors(
//   exclude: 'r' | 'g' | 'b' | 'none' = 'none',
//   clampBrightnessRange: [number, number] = [20, 100]
// ): Record<number, string> {
//   const colors: Record<number, string> = {};

//   for (let midi = 0; midi <= 127; midi++) {
//     const hue = (midi % 12) * 30;
//     const s = 70;
//     const l =
//       clampBrightnessRange[0] +
//       ((midi % 12) / 11) * (clampBrightnessRange[1] - clampBrightnessRange[0]);
//     const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
//     const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
//     const m = l / 100 - c / 2;

//     let r = 0,
//       g = 0,
//       b = 0;
//     if (hue < 60) {
//       r = c;
//       g = x;
//     } else if (hue < 120) {
//       r = x;
//       g = c;
//     } else if (hue < 180) {
//       g = c;
//       b = x;
//     } else if (hue < 240) {
//       g = x;
//       b = c;
//     } else if (hue < 300) {
//       r = x;
//       b = c;
//     } else {
//       r = c;
//       b = x;
//     }

//     if (exclude === 'r') r = 0;
//     else if (exclude === 'g') g = 0;
//     else if (exclude === 'b') b = 0;

//     const toHex = (n: number) =>
//       Math.round((n + m) * 255)
//         .toString(16)
//         .padStart(2, '0');
//     colors[midi] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
//   }

//   return colors;
// }

// export function generateMidiNoteColors(
//   exclude: 'r' | 'g' | 'b' | 'none' = 'none'
// ): Record<number, string> {
//   const colors: Record<number, string> = {};

//   for (let midi = 0; midi <= 127; midi++) {
//     const hue = (midi % 12) * 30;
//     const s = 70,
//       l = 50;
//     const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
//     const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
//     const m = l / 100 - c / 2;

//     let r = 0,
//       g = 0,
//       b = 0;
//     if (hue < 60) {
//       r = c;
//       g = x;
//     } else if (hue < 120) {
//       r = x;
//       g = c;
//     } else if (hue < 180) {
//       g = c;
//       b = x;
//     } else if (hue < 240) {
//       g = x;
//       b = c;
//     } else if (hue < 300) {
//       r = x;
//       b = c;
//     } else {
//       r = c;
//       b = x;
//     }

//     if (exclude === 'r') r = 0;
//     else if (exclude === 'g') g = 0;
//     else if (exclude === 'b') b = 0;

//     const toHex = (n: number) =>
//       Math.round((n + m) * 255)
//         .toString(16)
//         .padStart(2, '0');
//     colors[midi] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
//   }

//   return colors;
// }

// export function generateMidiNoteColors(): Record<number, string> {
//   const colors: Record<number, string> = {};

//   for (let midi = 0; midi <= 127; midi++) {
//     const hue = (midi % 12) * 30;
//     const s = 70,
//       l = 50;
//     const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
//     const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
//     const m = l / 100 - c / 2;

//     let r = 0,
//       g = 0,
//       b = 0;
//     if (hue < 60) {
//       r = c;
//       g = x;
//     } else if (hue < 120) {
//       r = x;
//       g = c;
//     } else if (hue < 180) {
//       g = c;
//       b = x;
//     } else if (hue < 240) {
//       g = x;
//       b = c;
//     } else if (hue < 300) {
//       r = x;
//       b = c;
//     } else {
//       r = c;
//       b = x;
//     }

//     const toHex = (n: number) =>
//       Math.round((n + m) * 255)
//         .toString(16)
//         .padStart(2, '0');
//     colors[midi] = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
//   }

//   return colors;
// }
