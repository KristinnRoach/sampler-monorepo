// /**
//  * Standardizes naming for audio worklet processors,
//  * class name convention: class SomeProcessor extends AudioWorkletProcessor
//  * registry name convention: registerProcessor('some-processor', SomeProcessor);
//  *
//  * @param {string} baseName - The core name for the processor (e.g., "sineosc")
//  * @returns {Object} Object with standardized names
//  */
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

  // Convert kebab-case and snake_case to camelCase
  const camelCaseName = normalizedName
    .replace(/[-_]([a-z0-9])/gi, (_, char) => char.toUpperCase())
    .replace(/[-_]/g, ''); // Remove any remaining hyphens and underscores

  // Create Pascal case name
  const pascalCaseName =
    camelCaseName.charAt(0).toUpperCase() + camelCaseName.slice(1);

  // Generate kebab-case name from camelCase
  const kebabCaseName = camelCaseName
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();

  return {
    // Class name in PascalCase with 'Processor' suffix
    className: `${pascalCaseName}Processor`,

    // Registry name in kebab-case with '-processor' suffix
    registryName: `${kebabCaseName}-processor`,
  };
}

// Todo: move tests below to test files!

// // basic test
// test();

// // MEGA test (overkill I knoow)
// testGetStandardizedAWPNames();

// // test function:
// function test() {
//   const testName = 'SineOscillatorProcessor';
//   const { className: firstClass, registryName: firstReg } =
//     getStandardizedAWPNames(testName);
//   console.log(
//     'First Class Name:',
//     firstClass,
//     'First Registry Name:',
//     firstReg
//   ); // SineOscillatorProcessor, sine-oscillator-processor
//   const { className: firstClassClass, registryName: firstClassReg } =
//     getStandardizedAWPNames(firstClass);

//   console.log(
//     'Second Class Name:',
//     firstClassClass,
//     'Second Registry Name:',
//     firstClassReg
//   ); // SineOscillatorProcessor, sine-oscillator-processor
//   const { className: firstRegClass, registryName: firstRegReg } =
//     getStandardizedAWPNames(firstReg);

//   console.log(
//     'Third Class Name:',
//     firstRegClass,
//     'Third Registry Name:',
//     firstRegReg
//   ); // SineOscillatorProcessor, sine-oscillator-processor
// }

// function testGetStandardizedAWPNames() {
//   // Test cases covering different formats
//   const testCases = [
//     // Standard CamelCase / PascalCase variations
//     'SineOscillator',
//     'sineOscillator',
//     'SineOscillatorProcessor',
//     'sineOscillatorProcessor',

//     // Kebab-case variations
//     'sine-oscillator',
//     'sine-oscillator-processor',

//     // With underscores
//     'sine_oscillator',
//     'sine_oscillator_processor',

//     // Mixed formats
//     'Sine-Oscillator',
//     'sine-Oscillator',
//     'Sine_oscillator',

//     // including file extension
//     'SineOscillator.js',
//     'sine-oscillator.js',
//     'SineOscillatorProcessor.js',
//     'sine-oscillator-processor.js',

//     // Short names
//     'loop',
//     'Loop',
//     'LPF',
//     'lpf',
//     'lpfProcessor',
//     'LPFProcessor',
//     'Lpf-Processor',

//     // With leading/trailing special characters
//     '.sineOscillator.js',
//     '-sine-oscillator-',

//     // Edge cases
//     'SINE',
//     's',
//     's-o-p',
//   ];

//   console.log('=== Comprehensive Test Results ===');
//   console.log('Format: Input → className → registryName');
//   console.log('================================');

//   testCases.forEach((input) => {
//     const { className, registryName } = getStandardizedAWPNames(input);
//     console.log(`${input} → ${className} → ${registryName}`);

//     // Double-check for idempotence (applying function twice should yield same result)
//     const secondPass = getStandardizedAWPNames(registryName);
//     const isConsistent =
//       secondPass.className === className &&
//       secondPass.registryName === registryName;

//     if (!isConsistent) {
//       console.log(
//         `  ⚠️ INCONSISTENCY: ${registryName} → ${secondPass.className} → ${secondPass.registryName}`
//       );
//     }
//   });
// }
