// TODO: move to generic utils package

export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const mapToRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  options: {
    warn?: boolean;
    name?: string;
  } = { warn: true }
) => {
  // Check if input is out of bounds
  if (value < inMin || value > inMax) {
    const paramName = options.name ? `(${options.name})` : '';
    if (options.warn) {
      console.warn(
        `Input value${paramName} ${value} is outside nominal range [${inMin}, ${inMax}]`
      );
    }
    // Clamp input value before mapping
    value = clamp(value, inMin, inMax);
  }

  // Handle special case where input range is a point
  if (inMax === inMin) {
    // When mapping from a point, output the middle of the target range
    return (outMax + outMin) / 2;
  }

  // Do the mapping
  const mapped =
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  // Ensure output is within bounds, considering that output range might be inverted
  return clamp(mapped, Math.min(outMin, outMax), Math.max(outMin, outMax));
};
