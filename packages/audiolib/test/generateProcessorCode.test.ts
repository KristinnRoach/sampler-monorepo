import { describe, it, expect } from 'vitest';
import { generateProcessorCode } from '@/nodes/worklet/base/generateProcessorCode';
import { AudioParamDescriptor } from '@/types/types';

describe('generateProcessorCode', () => {
  // Define a simple test process function
  interface ProcessInputs {
    [index: number]: Float32Array[];
  }

  interface ProcessOutputs {
    [index: number]: Float32Array[];
  }

  interface ProcessParameters {
    [name: string]: Float32Array;
  }

  const testProcessFunc = function (
    inputs: ProcessInputs,
    outputs: ProcessOutputs,
    _parameters: ProcessParameters
  ): boolean {
    // Simple pass-through
    const input = inputs[0];
    const output = outputs[0];

    if (input && output) {
      for (let channel = 0; channel < input.length; channel++) {
        for (let i = 0; i < input[channel].length; i++) {
          output[channel][i] = input[channel][i];
        }
      }
    }

    return true;
  };

  // Define sample parameters
  const testParams: AudioParamDescriptor[] = [
    {
      name: 'gain',
      defaultValue: 1.0,
      minValue: 0,
      maxValue: 1,
      automationRate: 'a-rate',
    },
  ];

  it('should generate valid processor code with basic parameters', () => {
    const code = generateProcessorCode(
      { className: 'TestProcessor', registryName: 'test-processor' },
      testProcessFunc,
      testParams
    );

    // Check that the code includes our class definition
    expect(code).toContain('class TestProcessor extends AudioWorkletProcessor');

    // Check that parameters are included
    expect(code).toContain(
      'return [{"name":"gain","defaultValue":1,"minValue":0,"maxValue":1,"automationRate":"a-rate"}]'
    );

    // Check that the registration happens
    expect(code).toContain(
      'registerProcessor("test-processor", TestProcessor)'
    );

    // Check that the process function is included
    expect(code).toContain('process(inputs, outputs, parameters)');
  });

  it('should include state initialization when provided', () => {
    const code = generateProcessorCode(
      { className: 'TestProcessor', registryName: 'test-processor' },
      testProcessFunc,
      testParams,
      { state: { counter: 0, isActive: true } }
    );

    // Check that state initialization is included
    expect(code).toContain('this.counter = 0');
    expect(code).toContain('this.isActive = true');
  });

  it('should include constructor code when provided', () => {
    const constructorCode = function (this: any): void {
      this.initialized = true;
      console.log('Processor initialized');
    };

    const code = generateProcessorCode(
      { className: 'TestProcessor', registryName: 'test-processor' },
      testProcessFunc,
      testParams,
      { constructorCode }
    );

    // Check that extra constructor code is included
    expect(code).toContain('this.initialized = true');
    expect(code).toContain('console.log("Processor initialized")');
  });

  it('should include message handler when provided', () => {
    function messageHandler(this: any, event: MessageEvent): void {
      if (event.data.type === 'configure') {
        this.config = event.data.value;
      }
    }

    const code = generateProcessorCode(
      { className: 'TestProcessor', registryName: 'test-processor' },
      testProcessFunc,
      testParams,
      { messageHandler }
    );

    // Check that message handler is included
    expect(code).toContain('if (event.data.type === "configure")');
    expect(code).toContain('this.config = event.data.value');
  });

  it('should throw error if process function is not a function', () => {
    expect(() => {
      generateProcessorCode(
        { className: 'TestProcessor', registryName: 'test-processor' },
        'not a function' as any,
        testParams
      );
    }).toThrow('Process function must be a function');
  });
});
