# AGENTS.md

## Build & Lint Commands
- `npm run dev` - Start development server
- `npm run build` - Type-check and build for production
- `npm run lint` - Run ESLint on all files
- No test framework configured

## Tech Stack
React 19, TypeScript, Vite, Tailwind CSS v4, Zustand (state), Radix UI (primitives), dnd-kit (drag-drop)

## Code Style
- **Imports**: Use `@/*` path alias for src/ imports (e.g., `import { Button } from "@/components/ui/button"`)
- **Types**: Strict mode enabled - no implicit any, no unused locals/params, explicit return types preferred
- **Components**: Functional components with TypeScript interfaces for props
- **Styling**: Tailwind CSS classes with shadcn/ui conventions (CSS variables for theming: `--primary`, `--background`, etc.)
- **State**: Zustand stores for global state management
- **Formatting**: Follow ESLint rules (react-hooks, react-refresh plugins active)

## Error Handling
TypeScript strict mode catches most issues at compile time. Always handle async errors explicitly.
