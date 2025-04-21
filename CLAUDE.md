# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `pnpm build` - Build all packages and apps
- Dev: `pnpm dev` - Start development servers
- Test: `pnpm test` - Run all tests
- Test single: `pnpm test src/path/to/file.test.ts` (in package directory)
- Lint: `pnpm lint` - Run ESLint on all packages
- Format: `pnpm format` - Format code with Prettier
- Check types: `pnpm check-types` - TypeScript type checking
- Clean: `pnpm clean` - Clean build artifacts
- Quick check: `pnpm go` - Run lint, type-check, and build

## Guidelines
- TypeScript with strict mode, target ES2022
- Use path alias `@/` for imports when available
- Format with Prettier (.ts, .tsx, .md files)
- Use ES Modules (type: "module" in package.json)
- Audio worklet files must be JavaScript (.js) not TypeScript
- Build framework-agnostic solutions in packages
- React components use functional style with hooks
- Keep API surface minimal for Web Audio API integration
- Follow existing patterns for audio processing and state management
- Consult Web Audio API specifications when implementing audio features