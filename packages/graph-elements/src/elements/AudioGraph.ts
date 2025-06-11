import van, { type ChildDom } from '@repo/vanjs-core';
import { define } from '@repo/vanjs-core/element';
import type { ElementProps } from '@repo/vanjs-core/element';
import { Audiolib, createAudiolib } from '@repo/audiolib';

export function createAudioGraph() {
  define('audio-graph', ({ attr, mount, $this }: ElementProps): ChildDom => {
    let audiolib: Audiolib | null = null;
    // let audioContext: AudioContext | null = null;

    mount(() => {
      // audioContext = new AudioContext();
      createAudiolib({ autoInit: true }) // audioContext,
        .then((lib) => (audiolib = lib))
        .catch((e) => console.error(e));

      // setupAutoResume();
      return () => {
        // audioContext?.close();
        audiolib?.dispose();
      };
    });

    // Event handlers
    // const increment = () => count.val++;
    // const decrement = () => count.val--;

    // function setupAutoResume(): Promise<void> {
    //   if (typeof document === 'undefined') return Promise.resolve();

    //   const resumeEvents = ['click', 'touchstart', 'keydown'];

    //   return new Promise((resolve) => {
    //     const handler = async () => {
    //       if (audioContext) {
    //         await audioContext.resume();

    //         resumeEvents.forEach((event: string) =>
    //           document.removeEventListener(event, handler as EventListener)
    //         );
    //         resolve();
    //       }
    //     };

    //     resumeEvents.forEach((event) =>
    //       document.addEventListener(event, handler, { once: true })
    //     );
    //   });
    // }

    const { div, h2, p, button, slot } = van.tags;

    return div(h2('Graph'), slot());
  });
}
