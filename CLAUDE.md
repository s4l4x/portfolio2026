# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

When making architectural changes (new files, moved types, renamed modules, new patterns), update this file to reflect them.

## What This Is

A design portfolio website showcasing work across projects (Apple, Twitter, Braid Health, IXOMOXI, etc.) with rich media galleries featuring video and image content.

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run host` — Dev server accessible over network
- `npm run build` — Full pipeline: type-check → generate LQIP/posters/manifest → Vite build
- `npm run lint` — ESLint on all TypeScript files
- `npm run type-check` — TypeScript checking only (no emit)
- `npm run generate-lqip` — Create 20px WebP blur-up placeholders for images
- `npm run generate-posters` — Extract first-frame JPG posters from videos (requires FFmpeg)
- `npm run generate-manifest` — Rebuild `src/data/media-manifest.ts` with asset dimensions/metadata (uses sips/ffprobe)

The prebuild hook runs all three generate scripts automatically before `npm run build`.

## Stack

React 19 + TypeScript 5.9 + Vite 7. Pure CSS (no Tailwind, no CSS-in-JS). No state management library — React hooks only. No animation library. Minimal dependencies by design.

## Architecture

**App.tsx is the main file (~640 lines).** It contains the component hierarchy inline: header, project sections, media display, and lightbox. There is no routing — it's a single scrollable page.

### Data Flow

1. **`src/data/projects.ts`** — Declarative array of `Project` objects, each with media items. Assets are Vite static imports.
2. **`src/types/media.ts`** — `MediaItem` interface. Can be image (default) or video (`type: "video"`).
3. **`src/types/project.ts`** — `Project` interface. Composes `MediaItem` and supports nested `subProjects`.
4. **`src/data/media-manifest.ts`** — Auto-generated file mapping asset paths to dimensions, LQIP paths, and poster paths. Do not edit manually.

### Audio Model

Two independent mute scopes, both managed in `App`:

- **Grid:** `unmutedVideoId` state — at most one video unmuted at a time. Unmuting one auto-mutes the previous. Each video's mute button toggles via `onToggleGridMute`. Grid mute state is stored on the element as `dataset.gridMuted` so it can be restored after lightbox close.
- **Lightbox:** `lightboxMuted` state — single toggle shared across all lightbox opens. Defaults to unmuted. Opening an unmuted grid video forces lightbox to unmuted; opening a muted one inherits existing lightbox state.

`useVideoAudioManager` still exists in `src/hooks/` but is no longer imported or used.

### Key Hooks

- **`useVideoLoadQueue`** — Loads videos one at a time, prioritizing closest-to-viewport. Supports priority override for lightbox.

### Media Pipeline

Assets live in `src/assets/{project-name}/`. Three build scripts generate supporting files:

- LQIP: `image.lqip.webp` (tiny blur-up placeholder)
- Posters: `video.poster.jpg` (first frame)
- Manifest: TypeScript map with dimensions for aspect-ratio pre-calculation (prevents layout shift)

### Lightbox

Animates the actual grid element to fullscreen (not a clone). Has three phases: entering → open → exiting. iOS devices use native `webkitEnterFullscreen()` for videos. Desktop lightbox has a controls layer (close button top-right, mute button bottom-right for videos with audio) that fades on 3s inactivity and reappears on mouse/touch activity.

### ShaderCanvas

WebGL component (`src/components/ShaderCanvas.tsx`) renders images with GLSL color-cycling shaders. Used for specific media items via the `shader` field on `MediaItem`.

## Styling

Pure CSS in `App.css` and `index.css`. CSS Grid for metadata layout, Flexbox for horizontal media rows. Background color `#DFD0CB`. Single responsive breakpoint at 768px.
