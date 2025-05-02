# Tone.js Testing with Vitest

This guide shows how to implement Web Audio API testing using Vitest, as an alternative to the original Tone.js testing setup.

## Setup

### 1. Dependencies

```json
{
    "devDependencies": {
        "vitest": "^1.4.0",
        "@vitest/browser": "^1.4.0",
        "puppeteer": "^24.2.1",
        "typescript": "^5.4.5",
        "@types/web-audio-api": "^0.2.16",
        "vite": "^5.2.11"
    },
    "scripts": {
        "test": "vitest",
        "test:ui": "vitest --ui",
        "test:coverage": "vitest run --coverage"
    }
}
```

### 2. Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: 'happy-dom',
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        browser: {
            enabled: true,
            name: 'chrome',
            provider: 'puppeteer',
            headless: true
        },
        setupFiles: ['src/test/setup.ts'],
        globals: true
    }
});
```

### 3. Test Setup

```typescript
// src/test/setup.ts
import { beforeAll, afterAll, vi } from 'vitest';

beforeAll(() => {
    if (!global.AudioContext) {
        global.AudioContext = vi.fn(() => ({
            sampleRate: 44100,
            createOscillator: vi.fn(),
            createGain: vi.fn(),
            createAnalyser: vi.fn(),
        })) as any;
    }
});

afterAll(() => {
    vi.restoreAllMocks();
});
```

## Audio Testing Utilities

```typescript
// src/test/audioTestUtils.ts
export async function renderAudio(
    callback: (context: OfflineAudioContext) => Promise<void> | void,
    duration: number = 1,
    channels: number = 1,
    sampleRate: number = 44100
): Promise<AudioBuffer> {
    const context = new OfflineAudioContext(channels, sampleRate * duration, sampleRate);
    await callback(context);
    return await context.startRendering();
}

export function compareBuffers(bufferA: AudioBuffer, bufferB: AudioBuffer, threshold = 0.001): boolean {
    if (bufferA.length !== bufferB.length || bufferA.numberOfChannels !== bufferB.numberOfChannels) {
        return false;
    }

    for (let channel = 0; channel < bufferA.numberOfChannels; channel++) {
        const dataA = bufferA.getChannelData(channel);
        const dataB = bufferB.getChannelData(channel);

        for (let i = 0; i < dataA.length; i++) {
            if (Math.abs(dataA[i] - dataB[i]) > threshold) {
                return false;
            }
        }
    }
    return true;
}
```

## Example Test

```typescript
// src/audioNode.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderAudio } from './test/audioTestUtils';
import { MyAudioNode } from './MyAudioNode';

describe('MyAudioNode', () => {
    let audioContext: AudioContext;

    beforeEach(() => {
        audioContext = new AudioContext();
    });

    afterEach(() => {
        return audioContext.close();
    });

    it('processes audio correctly', async () => {
        const buffer = await renderAudio(async (context) => {
            const node = new MyAudioNode(context);
            const oscillator = context.createOscillator();
            
            oscillator.connect(node);
            node.connect(context.destination);
            oscillator.start();
        });

        expect(buffer.duration).toBe(1);
        expect(buffer.numberOfChannels).toBe(1);
    });
});
```

## Key Features

- Browser-based testing with Puppeteer
- Built-in TypeScript support
- Parallel test execution
- Watch mode and UI for debugging
- Coverage reporting
- Snapshot testing
- Mocking utilities
- Fast execution with Vite

## Advantages Over Original Setup

1. Fewer dependencies
2. Simpler configuration
3. Better TypeScript integration
4. Modern testing features
5. Improved developer experience
6. Better Vite integration

The setup maintains all audio testing capabilities while providing a more streamlined development experience.