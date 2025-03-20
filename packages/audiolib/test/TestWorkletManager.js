// TestWorkletManager.js
// Handles processor registration and tracking

export class TestWorkletManager {
  constructor() {
    this.registeredProcessors = new Set();
  }

  /**
   * Check if a processor has been registered
   */
  hasRegistered(processorName) {
    // todo: ensure correct casing (class = Pascal, registry = kebab)
    return this.registeredProcessors.has(processorName);
  }

  /**
   * Register a processor with the audio context
   */
  async registerProcessor(context, processorCode, processorRegistryName) {
    if (this.hasRegistered(processorRegistryName)) {
      return Promise.resolve(processorRegistryName);
    }

    const blob = new Blob([processorCode], {
      type: 'application/javascript',
    });

    await context.audioWorklet.addModule(URL.createObjectURL(blob));
    this.registeredProcessors.add(processorRegistryName);

    return processorRegistryName;
  }

  /**
   * Generate processor code from a process function and params
   */
  generateProcessorCode(
    { className, registryName },
    processFunc,
    params = [],
    options = {}
  ) {
    if (typeof processFunc !== 'function') {
      throw new Error('Process function must be a function');
    }

    const paramsJSON = JSON.stringify(params);

    // Extract just the function body
    let funcBody = processFunc.toString();
    // Remove the function declaration part and just keep the body
    funcBody = funcBody.substring(
      funcBody.indexOf('{') + 1,
      funcBody.lastIndexOf('}')
    );

    // Process state initialization
    const stateInit = options.state
      ? Object.entries(options.state)
          .map(([key, value]) => `this.${key} = ${JSON.stringify(value)};`)
          .join('\n          ')
      : '';

    // Process constructor code if provided
    const extraConstructorCode = options.constructorCode
      ? options.constructorCode
          .toString()
          .substring(
            options.constructorCode.indexOf('{') + 1,
            options.constructorCode.lastIndexOf('}')
          )
      : '';

    // Process message handler if provided
    let messageHandler;
    if (options.messageHandler) {
      const handlerStr = options.messageHandler.toString();
      const handlerBody = handlerStr.substring(
        handlerStr.indexOf('{') + 1,
        handlerStr.lastIndexOf('}')
      );

      messageHandler = `this.port.onmessage = (event) => {
              if (event.data.hasOwnProperty('active')) {
                this.active = event.data.active;
              }
              ${handlerBody}
            };`;
    } else {
      messageHandler = `this.port.onmessage = (event) => {
              if (event.data.hasOwnProperty('active')) {
                this.active = event.data.active;
              }
            };`;
    }

    return `
      class ${className} extends AudioWorkletProcessor {
        static get parameterDescriptors() {
          return ${paramsJSON};
        }

        constructor() {
          super();
          this.active = true;
          ${stateInit}
          ${messageHandler}
          ${extraConstructorCode}
        }

        process(inputs, outputs, parameters) {
          if (!this.active) return true;
          ${funcBody}
        }
      }

      registerProcessor('${registryName}', ${className});
    `;
  }
}
