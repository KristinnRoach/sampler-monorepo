// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { KnobElement } from './KnobElement';

customElements.define('knob-element', KnobElement);

function createKnob(attrs: Record<string, string>): KnobElement {
  const el = document.createElement('knob-element') as KnobElement;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

describe('KnobElement init', () => {
  it('initializes to default synchronously on connect', () => {
    const knob = createKnob({
      'min-value': '0',
      'max-value': '100',
      'default-value': '25',
    });
    document.body.appendChild(knob);
    expect(knob.getValue()).toBe(25);
  });

  it('tags programmatic changes in knob-change detail', () => {
    const knob = createKnob({
      'min-value': '0',
      'max-value': '100',
      'default-value': '25',
    });
    document.body.appendChild(knob);
    let source: string | undefined;
    knob.addEventListener('knob-change', (e) => (source = e.detail.source));
    knob.setValue(50);
    expect(source).toBe('programmatic');
  });

  it('honors a default of 0 when min is non-zero', () => {
    const knob = createKnob({
      'min-value': '-50',
      'max-value': '50',
      'default-value': '0',
    });
    document.body.appendChild(knob);
    expect(knob.getValue()).toBe(0);
  });

  it('does not clobber a value set right after appendChild', async () => {
    vi.useFakeTimers();
    const knob = createKnob({
      'min-value': '0',
      'max-value': '100',
      'default-value': '25',
    });
    document.body.appendChild(knob);
    knob.setValue(80); // consumer restores persisted value
    vi.runAllTimers(); // deferred createDraggable fires
    expect(knob.getValue()).toBe(80);
    vi.useRealTimers();
  });
});
