# Tone.js Testing Guide

This guide outlines the essential testing infrastructure for Web Audio API testing, extracted from Tone.js. Use this as a reference for implementing audio testing in your own Web Audio projects.

## Core Components

### 1. Test Runner Configuration

```javascript
export default {
    files: ["./build/*/Tone/**/*.test.js"],
    nodeResolve: true,
    browsers: [
        puppeteerLauncher({
            launchOptions: {
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--use-fake-ui-for-media-stream",
                    "--use-fake-device-for-media-stream",
                    "--autoplay-policy=no-user-gesture-required",
                ],
            },
        }),
    ],
    testFramework: {
        config: {
            timeout: 10000,
            retries: 2,
            ui: "bdd",
        },
    }
}
```

### 2. TestAudioBuffer Class

Core class for audio comparison:

```typescript
export class TestAudioBuffer {
    static async fromUrl(
        url: string,
        channels = 1,
        sampleRate = 11025
    ): Promise<TestAudioBuffer> {
        const response = await fetch(url);
        if (response.ok) {
            const buffer = await response.arrayBuffer();
            const context = new OfflineAudioContext(channels, 1, sampleRate);
            const audioBuffer = await context.decodeAudioData(buffer);
            return new TestAudioBuffer(audioBuffer);
        } else {
            throw new Error(`could not load url ${url}`);
        }
    }
}
```

### 3. Offline Testing Utility

For rendering audio in tests:

```typescript
export async function OfflineRender(
    callback: (context: OfflineAudioContext) => Promise<void> | void,
    duration = 0.001,
    channels = 1,
    sampleRate = 11025
): Promise<TestAudioBuffer> {
    // the offline context
    const offlineContext = new OfflineAudioContext(
        channels,
        Math.floor(duration * sampleRate),
        sampleRate
    ) as unknown as OfflineAudioContext;

    // wait for the callback
    await callback(offlineContext);

    // render the buffer
    const buffer = await offlineContext.startRendering();

    // wrap the buffer
    return new TestAudioBuffer(buffer);
}

/**
 * Returns true if the input passes audio to the output
 */
export async function PassesAudio(
    callback: (
        context: OfflineAudioContext,
        input: ConstantSourceNode,
        output: AudioDestinationNode
    ) => Promise<void> | void
): Promise<boolean> {
    const buffer = await OfflineRender(
        async (context) => {
            const source = context.createConstantSource();
            source.start(0);
            source.offset.setValueAtTime(0, 0);
            source.offset.setValueAtTime(1, 0.25);
            const destination = context.destination;
            await callback(context, source, destination);
        },
        0.5,
        1,
        11025
    );
}
```

### 4. CompareToFile Utility

For comparing audio output against reference files:

```typescript
export async function CompareToFile(
    callback,
    url: string,
    threshold = 0.001,
    RENDER_NEW = false,
    duration = 0.1,
    channels = 1
): Promise<void> {
    url = "test/audio/compare/" + url;
    const response = await getBuffersToCompare(
        callback,
        url,
        duration,
        channels,
        44100,
        RENDER_NEW
    );
    if (response) {
        const { bufferA, bufferB } = response;
        const error = Compare.compareSpectra(bufferA, bufferB);
        if (error > threshold) {
            throw new Error(
                `Error ${error} greater than threshold ${threshold}`
            );
        }
    }
}
```

### 5. Required Dependencies

Add these to your package.json:

```json
{
    "devDependencies": {
        "@web/test-runner": "^0.20.0",
        "@web/test-runner-puppeteer": "^0.18.0",
        "audiobuffer-to-wav": "^1.0.0",
        "chai": "^5.1.0",
        "mocha": "^11.1.0",
        "puppeteer": "^24.2.1"
    }
}
```

## Key Features

This testing setup provides:
1. Offline audio rendering for tests
2. Audio buffer comparison
3. Spectrum analysis
4. Reference file comparison
5. Browser automation with proper audio permissions
6. Utilities for common audio testing patterns

## Example Usage

```typescript
describe("MyAudioNode", () => {
    it("processes audio correctly", async () => {
        // Test audio processing
        await CompareToFile(
            (context) => {
                const node = new MyAudioNode(context);
                // Setup audio graph
                node.connect(context.destination);
            },
            "reference.wav",
            0.001
        );
    });

    it("passes audio through", async () => {
        // Test if audio flows through the node
        const passes = await PassesAudio(
            (context, input, output) => {
                const node = new MyAudioNode(context);
                input.connect(node);
                node.connect(output);
            }
        );
        expect(passes).to.be.true;
    });
});
```

This setup provides a robust foundation for testing Web Audio API code with:
- Automated browser testing
- Audio output verification
- Spectrum comparison
- Reference file matching
- Common audio testing utilities