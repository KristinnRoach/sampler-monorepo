# Instrument Controls Usage

## Pattern

1. **Instrument broadcasts ready event**
2. **Controls listen for event and connect**

## Implementation

### Instrument Element

```typescript
samplePlayer.onMessage('sample-player:ready', () => {
  registerSampler(nodeId.val, samplePlayer);
  document.dispatchEvent(
    new CustomEvent('sampler-ready', {
      detail: { nodeId: nodeId.val },
    })
  );
});

// Add convenience getter
attributes.$this.nodeId = nodeId.val;
```

### Control Element

```typescript
export const MyKnob = (attributes: ElementProps) => {
  const targetNodeId = attributes.attr('target-node-id', '');
  const value = van.state(0.5);
  let connected = false;

  const findNodeId = () => {
    if (targetNodeId.val) return targetNodeId.val;

    // Find parent sampler-element
    const parent = attributes.$this.closest('sampler-element');
    if (parent) return parent.getAttribute('data-node-id');

    // Find nearest sampler-element
    const nearest = document.querySelector('sampler-element');
    return nearest?.getAttribute('data-node-id') || '';
  };

  const connect = () => {
    if (connected) return;
    const nodeId = findNodeId();
    const sampler = getSampler(nodeId);
    if (sampler) {
      connected = true;
      van.derive(() => (sampler.myProperty = value.val));
    }
  };

  attributes.mount(() => {
    connect();
    const handleReady = (e: CustomEvent) => {
      if (e.detail.nodeId === findNodeId()) connect();
    };
    document.addEventListener('sampler-ready', handleReady);
    return () => document.removeEventListener('sampler-ready', handleReady);
  });

  return createLabeledKnob({
    label: 'My Control',
    defaultValue: 0.5,
    onChange: (v) => (value.val = v),
  });
};
```

## Usage

### With Custom Node ID

```html
<sampler-element node-id="sampler1"></sampler-element>
<volume-knob target-node-id="sampler1"></volume-knob>
<reverb-knob target-node-id="sampler1"></reverb-knob>
```

## Usage

### With Custom Node ID

```html
<sampler-element node-id="sampler1"></sampler-element>
<volume-knob target-node-id="sampler1"></volume-knob>
<reverb-knob target-node-id="sampler1"></reverb-knob>
```

### Using Default Node ID

#### HTML - Slotted Controls (auto-detects parent)

```html
<sampler-element>
  <volume-knob></volume-knob>
  <reverb-knob></reverb-knob>
</sampler-element>
```

#### HTML - Nearest Sampler (auto-finds closest)

```html
<sampler-element></sampler-element>
<volume-knob></volume-knob>
<reverb-knob></reverb-knob>
```

#### JavaScript - Convenience Getter

```javascript
const samplerEl = document.querySelector('sampler-element');
const volumeKnob = document.createElement('volume-knob');
volumeKnob.setAttribute('target-node-id', samplerEl.nodeId);
```
