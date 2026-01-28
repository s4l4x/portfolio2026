# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server with hot reload
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run type-check   # TypeScript check only
npm run preview      # Preview production build locally
```

## Architecture

React 19 + TypeScript portfolio site with Three.js shader-based visuals. Vite 7 for bundling.

### Image Rendering System

ProjectCard uses two rendering approaches:
- **TiledImage** (default): 12x9 instanced mesh grid with per-tile UV offsets. Uses IntersectionObserver to control "snap" state for scroll-based parallax.
- **ShaderImage**: Direct shader rendering when `shader: 'colorCycle'` is set on a project. Both support optional `foregroundImage` for layered effects.

### Background Shader

BackgroundShader.tsx is a fixed layer rendering animated SDF shapes:
- Extracts 3 dominant colors from each project image via canvas pixel sampling
- Smooth color transitions as user scrolls between projects
- Physics-based shape movement with SDF collision detection
- Leva controls for dev-time parameter tuning (removed in production via Vite alias)

### Shader Patterns

Shaders imported as raw strings: `import shader from '../shaders/file.glsl?raw'`

SDF library in `src/shaders/sdf/`:
- `primitives.glsl` - 3D shapes (sphere, box, torus, cone, octahedron, etc.)
- `operations.glsl` - Boolean ops, smooth blending, domain repetition, rotations
- `utils.glsl` - Blend modes, color functions, easing, noise

Import via: `import { primitives, operations, combineShaders } from './shaders/sdf'`

### Three.js Integration

- Uses `@react-three/fiber` with orthographic camera for 2D-like projection
- useFrame hook for animation (delta time aware)
- Custom geometry attributes for instanced rendering (aUvOffset, aIndex)
- Hover state interpolation uses 0.08-0.12 factors for smooth easing

## Project Data

Projects defined in `src/data/projects.ts` with interface in `src/types/project.ts`:
```typescript
interface Project {
  title: string;
  description: string;
  startDate: string;        // "YYYY-MM"
  endDate?: string;
  image: string;
  foregroundImage?: string;
  shader?: ShaderType;      // 'colorCycle'
}
```

## Build Configuration

Vite config (`vite.config.ts`):
- Path alias `@` → `src/`
- Production alias: `leva` → `src/lib/leva-stub.ts` (strips Leva UI from prod)
- `BASE_PATH` env variable for GitHub Pages subdirectory deployment

Deployed to: https://s4l4x.github.io/portfolio2026/
