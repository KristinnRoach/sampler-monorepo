import type { State, ChildDom } from '../van';

export type ElementProps = {
  /** Get the value of an attribute */
  attr: (name: string, defaultValue?: string | number) => State<string>;
  /** Get or create a reactive property */
  prop: <T = any>(name: string, defaultValue?: T) => State<T>;
  /** Registers a callback that is called when the element connects to the DOM */
  mount: (
    /** Callback when the element connects to the DOM
     * @returns An optional dismount callback
     */
    mount: () => (() => void) | void
  ) => void;
  /** Instance of the custom element with public getters & setters*/
  $this: HTMLElement & {
    setProp: <T = any>(name: string, value: T) => HTMLElement;
    getProp: <T = any>(name: string) => T | undefined;
  };
};

/**
 * Defines a VanJS custom element with both attributes and properties support.
 */
export declare const define: (
  /** Name of the custom element */
  name: string,
  /** VanJS functional component */
  element: (
    /** Attributes and properties of the custom element */
    props: ElementProps
  ) => ChildDom,
  options?: ShadowRootInit | false
) => void;
