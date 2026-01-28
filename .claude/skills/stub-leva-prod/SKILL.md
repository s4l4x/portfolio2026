---
name: stub-leva-prod
description: Strip Leva debug controls from production builds using a Vite alias stub
disable-model-invocation: true
allowed-tools: Read, Write, Edit, Glob, Bash(mkdir *)
---

# Stub Leva in Production

Strip Leva debug UI from production builds by replacing it with a no-op stub module via Vite alias. This typically saves ~50-70 KB gzipped from the bundle.

## Prerequisites

- Vite-based project
- Leva installed and used for debug controls

## Steps

### 1. Create the Stub Module

Create `src/lib/leva-stub.ts`:

```typescript
// Production stub for leva - returns static values, no UI
export function useControls(_name: string, schema: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  function extractValues(obj: Record<string, unknown>) {
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === 'object' && 'value' in val) {
        result[key] = (val as { value: unknown }).value;
      } else if (val && typeof val === 'object' && !('value' in val)) {
        extractValues(val as Record<string, unknown>);
      }
    }
  }

  extractValues(schema);
  return result;
}

// Stub folder - just passes through
export function folder<T>(schema: T): T {
  return schema;
}

// Stub Leva component - renders nothing
export function Leva() {
  return null;
}

// Stub other common exports
export function button() {}
export function buttonGroup() {}
export function monitor() {}
export const levaStore = {};
```

### 2. Update Vite Config

Modify `vite.config.ts` to alias `leva` to the stub in production:

```typescript
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig(({ mode }) => ({
  // ... existing config
  resolve: {
    alias: {
      // Replace leva with a no-op stub in production
      ...(mode === 'production' && {
        leva: path.resolve(__dirname, 'src/lib/leva-stub.ts'),
      }),
    },
  },
}))
```

**Note:** If the config already has `resolve.alias`, merge the leva alias into the existing object.

### 3. Verify

Run a production build and compare bundle sizes:

```bash
npm run build
```

The JS bundle should be ~50-70 KB smaller gzipped.

## How It Works

- In **development**: Vite loads the real `leva` package, giving you the full debug UI
- In **production**: Vite aliases `leva` imports to the stub, which:
  - `useControls` extracts default values from the schema and returns them
  - `folder` passes through (it's just organizational)
  - `Leva` component renders nothing
  - All other exports are no-ops

This means your code doesn't need any changes - it imports from `leva` normally, and Vite handles the swap at build time.
