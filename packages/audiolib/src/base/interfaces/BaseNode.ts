/* INTERFACE */
export default interface BaseNode {
  setParam(name: string, value: number, time?: number): boolean;
}
