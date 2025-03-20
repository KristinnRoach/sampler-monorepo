/**
 * Standardizes naming for audio worklet processors,
 * class name convention: class SomeProcessor extends AudioWorkletProcessor
 * registry name convention: registerProcessor('some-processor', SomeProcessor);
 *
 * @param {string} baseName - The core name for the processor (e.g., "sineosc")
 * @returns {Object} Object with standardized names
 */
export function getStandardizedAWPNames(baseName: string): {
  className: string;
  registryName: string;
} {
  // Clean the base name - only allow alphanumeric, dash and underscore
  const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '');

  // Remove 'Processor', '-processor', or '.js' from the end if present
  const normalizedName = cleanName
    .replace(/Processor$/i, '')
    .replace(/-processor$/i, '')
    .replace(/\.js$/i, '');

  // Convert to proper Pascal case for class name
  const pascalCaseName =
    normalizedName.charAt(0).toUpperCase() + normalizedName.slice(1);

  // Convert PascalCase/camelCase to kebab-case
  const kebabCaseName = normalizedName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2') // insert hyphen between lower->upper transitions
    .toLowerCase();

  return {
    // Class name in PascalCase with 'Processor' suffix
    className: `${pascalCaseName}Processor`,

    // Registry name in kebab-case with '-processor' suffix
    registryName: `${kebabCaseName}-processor`,
  };
}

// test function:

// const test = () => {
//   const testName = 'SineOscillatorProcessor';
//   const { className, registryName } = getStandardizedAWPNames(testName);

//   console.log('Class Name:', className); // SineOscillatorProcessor
//   console.log('Registry Name:', registryName); // sine-oscillator-processor
// };

// // test();
