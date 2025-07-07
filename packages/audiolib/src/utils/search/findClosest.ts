/**
 * Generic binary search that finds the closest element using a custom comparison function
 * @param sortedArray - Array sorted according to the compareValue function
 * @param target - Target value to search for
 * @param getValue - Function to extract comparison value from array elements (defaults to identity for number arrays)
 * @param getDistance - Optional function to calculate distance (defaults to absolute difference)
 * @returns The closest element from the array
 */
export function findClosest<T>(
  sortedArray: T[],
  target: number,
  getValue: (item: T) => number = (x) => x as unknown as number,
  getDistance: (a: number, b: number) => number = (a, b) => Math.abs(a - b)
): T {
  if (sortedArray.length === 0) {
    throw new Error('Array cannot be empty');
  }

  if (sortedArray.length === 1) {
    return sortedArray[0];
  }

  const targetValue = target;
  const firstValue = getValue(sortedArray[0]);
  const lastValue = getValue(sortedArray[sortedArray.length - 1]);

  // Handle edge cases
  if (targetValue <= firstValue) return sortedArray[0];
  if (targetValue >= lastValue) return sortedArray[sortedArray.length - 1];

  // Binary search for insertion point
  let left = 0;
  let right = sortedArray.length - 1;

  while (left < right - 1) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(sortedArray[mid]);

    if (midValue === targetValue) {
      return sortedArray[mid]; // Exact match
    } else if (midValue < targetValue) {
      left = mid;
    } else {
      right = mid;
    }
  }

  // Compare the two closest candidates
  const leftDistance = getDistance(getValue(sortedArray[left]), targetValue);
  const rightDistance = getDistance(getValue(sortedArray[right]), targetValue);

  return leftDistance <= rightDistance ? sortedArray[left] : sortedArray[right];
}
