/**
 * Standardizes naming for audio worklet processors,
 * class name convention: class SomeProcessor extends AudioWorkletProcessor
 * registry name convention: registerProcessor('some-processor', SomeProcessor);
 *
 * @param {string} baseName - The core name for the processor (e.g., "sineosc")
 * @returns {Object} Object with standardized names
 */
export function getStandardizedAWPNames(baseName) {
  // Clean the base name - only allow alphanumeric, dash and underscore
  const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '');

  // todo: remove Processor, -processor, .js from end if present

  return {
    // Class name in PascalCase with 'Processor' suffix
    className: `${cleanName.charAt(0).toUpperCase()}${cleanName.slice(1)}Processor`,

    // Registry name in kebab-case with '-processor' suffix
    registryName: `${cleanName.toLowerCase()}-processor`,
  };
}
