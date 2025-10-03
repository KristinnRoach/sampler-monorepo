# Framework Wrappers Test App

A minimal Vite + TypeScript + React application for testing the audio-components React wrappers.

## Quick Start

```bash
# From the monorepo root
cd apps/frameworksTest

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

The app will open at `http://localhost:3001` and showcase:

- Basic KnobComponent usage
- Preset configurations (volume, feedback, pan)
- Custom styling and formatting
- Different interaction modes (continuous, stepped)
- Event handling and state management

## What it tests

- ✅ React wrapper functionality
- ✅ TypeScript integration
- ✅ Event handling (onChange callbacks)
- ✅ Preset system integration
- ✅ Custom styling and formatting
- ✅ Value display and formatting
- ✅ Different knob configurations

## Adding more tests

To test additional components or frameworks:

1. Add new dependencies to `package.json`
2. Create test components in `src/`
3. Import and use in `App.tsx`

The structure is designed to be minimal and focused on testing the wrapper functionality.
