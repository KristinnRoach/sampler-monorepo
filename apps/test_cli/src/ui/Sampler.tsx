import { Component } from 'solid-js';

interface SamplerProps {
  audiolib_instance: any;
}

const SamplerUI: Component<SamplerProps> = (props) => {
  const lib = props.audiolib_instance;

  console.log('audiolib_instance:', lib);
  return <div></div>;
};

export default SamplerUI;
