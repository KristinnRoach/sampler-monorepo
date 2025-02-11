import { createSignal, createEffect, onCleanup, onMount } from 'solid-js';
import { isOnline, onNetworkChange } from '../utils/networkUtils';

import { Audiolib } from '@repo/audiolib';

import SamplerUI from '../ui/Sampler';

const LIB = new Audiolib();

export default function App() {
  createEffect(() => {
    console.log('isOnline:', isOnline());
  });

  onMount(async () => {
    await LIB.initialize();
  });

  return (
    <>
      <h1>test audiolib</h1>
      <p>isOnline: {isOnline().toString()}</p>

      <div id='instrument'>
        <p>Instrument component:</p>
        <SamplerUI audiolib_instance={LIB} />
      </div>
    </>
  );
}
