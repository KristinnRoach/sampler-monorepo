import React, { useRef, useEffect, useState } from 'react';
import { OscilloscopeElement } from '../../../elements/OscilloscopeElement';

export interface OscilloscopeComponentProps {
  audioContext?: AudioContext;
  inputNode?: AudioNode;
}

export const OscilloscopeComponent = ({
  audioContext,
  inputNode,
}: OscilloscopeComponentProps): React.ReactElement => {
  const ref = useRef<HTMLElement & OscilloscopeElement>(null);
  const [isElementReady, setIsElementReady] = useState(false);

  useEffect(() => {
    // Wait for the custom element to be defined
    if (customElements.get('oscilloscope-element')) {
      setIsElementReady(true);
    } else {
      customElements.whenDefined('oscilloscope-element').then(() => {
        setIsElementReady(true);
      });
    }
  }, []);

  useEffect(() => {
    if (ref.current && audioContext && inputNode && isElementReady) {
      (ref.current as OscilloscopeElement).connectAudio(
        audioContext,
        inputNode
      );
    }
  }, [audioContext, inputNode, isElementReady]);

  if (!isElementReady) {
    return React.createElement('div', {}, 'Loading oscilloscope...');
  }

  return React.createElement('oscilloscope-element', {
    ref: ref as React.Ref<HTMLElement>,
  });
};
