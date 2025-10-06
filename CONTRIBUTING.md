# Contributing

## Setup

```bash
# Clone
git clone https://github.com/KristinnRoach/sampler-monorepo.git
cd sampler-monorepo

# Install (requires Node.js >= 18)
pnpm install

# Run dev server
pnpm watch
```

## Development

- **Build all packages:** `pnpm build`
- **Run tests:** `pnpm test`
- **Run E2E tests:** `pnpm test:e2e`

## Project Structure

- `packages/audiolib` - Core audio processing
- `packages/audio-components` - Web components
- `packages/input-controller` - Keyboard input
- `apps/play` - Main sampler app

## Making Changes

1. Create a branch
2. Make your changes
3. Run tests
4. Submit a PR

## Questions?

Open an issue.
