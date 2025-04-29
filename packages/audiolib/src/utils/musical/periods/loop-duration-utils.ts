//
/****** ! NOT IN USE - just for reference when I get around to it (e.g. change createScale to ts first) */

export function snapToDuration(
  paramToProcess: 'start' | 'end',
  start: number,
  end: number,
  allowedDistances: number[]
): number {
  const currentDistance = Math.abs(end - start);

  let closestAllowed = allowedDistances[0];
  let minDifference = Math.abs(currentDistance - closestAllowed);

  for (const dist of allowedDistances) {
    const difference = Math.abs(currentDistance - dist);
    if (difference < minDifference) {
      minDifference = difference;
      closestAllowed = dist;
    }
  }

  if (paramToProcess === 'end') return start + closestAllowed;
  else return end - closestAllowed;
}

// if (allowedDistances.includes(currentDistance)) return paramValue;

//   // If the current distance is less than the minimum allowed distance, return the original value
//   if (currentDistance < Math.min(...allowedDistances)) {
//     return paramValue;
//   }
//   // If the current distance is greater than the maximum allowed distance, return the original value
//   if (currentDistance > Math.max(...allowedDistances)) {
//     return paramValue;
//   }
//   // If the current distance is negative, return the original value
//   if (currentDistance < 0) {
//     return paramValue;
//   }

// class Snapper {
//   allowedValues: number[];

//   constructor(allowedDistances: number[]) {
//     this.allowedValues = allowedDistances;
//   }

//   snapToDuration(
//     paramToProcess: 'start' | 'end',
//     start: number,
//     end: number
//   ): number {
//     const currentDistance = Math.abs(end - start);

//     let closestAllowed = this.allowedValues[0];
//     let minDifference = Math.abs(currentDistance - closestAllowed);

//     for (const dist of this.allowedValues) {
//       const difference = Math.abs(currentDistance - dist);
//       if (difference < minDifference) {
//         minDifference = difference;
//         closestAllowed = dist;
//       }
//     }

//     if (paramToProcess === 'end') return start + closestAllowed;
//     else return end - closestAllowed;
//   }
// }
