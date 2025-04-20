# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands
- Build: `pnpm build` - Build library
- Dev: `pnpm dev` - Start development server
- Test: `pnpm test` - Run all tests
- Test single: `pnpm test src/path/to/file.test.ts`
- Lint: `pnpm lint` - Check code style
- Format: `pnpm format` - Format code with Prettier

## Guidelines
- Prioritize simplicity and reliability over complexity
- Build framework-agnostic solutions importable by any consuming app
- TypeScript with ES2022 target, use path alias `@/` for imports
- Audio worklet files must be JavaScript (.js) not TypeScript
- Keep API surface minimal and intuitive for Web Audio API integration
- Follow existing patterns for audio processing, event handling, and state management
- Prototype-focused: favor working solutions over perfect architecture
- Consult latest Web Audio API and AudioWorklets specifications when implementing features