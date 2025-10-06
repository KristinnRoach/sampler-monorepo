# Hljóð-Smali

A web-based musical sampler instrument built with TypeScript and the Web Audio API. Record audio samples and play them back using your keyboard like a musical instrument.

🎹 **[Try the Live Demo](https://kristinnroach.github.io/sampler-monorepo/)**

## Overview

Hljóð-Smali is a monorepo project containing custom audio processing packages and UI components for building browser-based musical instruments. The project demonstrates modern web development practices including TypeScript, modular architecture, and real-time audio processing.

## Features

- **Real-time audio sampling**: Record audio directly from your microphone
- **Keyboard-based playback**: Play samples using computer keyboard like a piano
- **Audio manipulation**: Transpose, detune, and apply envelope controls
- **Loop controls**: Loop samples with customizable points
- **Visual feedback**: Waveform display with interactive controls

## Tech Stack

- **TypeScript** - Type-safe development
- **Web Audio API** - Real-time audio processing
- **TurboRepo** - Monorepo management
- **Vite** - Fast build tooling
- **Vanilla Web Components** - Framework-agnostic UI components

## Project Structure

This monorepo contains:

- **`packages/audiolib`** - Core audio processing engine extending Web Audio API
- **`packages/audio-components`** - Reusable web components for audio UIs
- **`packages/input-controller`** - Keyboard input handling
- **`apps/play`** - Main sampler application

## Getting Started

```bash
# Install dependencies
pnpm install

# Run development server
pnpm watch

# Build for production
pnpm build
```

## Development

Built as a final project for my BS in Computer Science at the University of Iceland, and further developed post-graduation to create a production-ready web application.

## License

MIT

---

**Note**: This is an active development project. Some features are experimental.
