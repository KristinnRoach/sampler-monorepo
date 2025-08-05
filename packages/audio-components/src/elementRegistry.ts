// elementRegistry.ts
const registeredElements = new Set();

export function defineElement(
  tagName: string,
  elementClass: CustomElementConstructor
) {
  if (!registeredElements.has(tagName) && !customElements.get(tagName)) {
    customElements.define(tagName, elementClass);
    registeredElements.add(tagName);
  }
}
