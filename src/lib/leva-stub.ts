// Production stub for leva - returns static values, no UI
export const PHYSICS_DEFAULTS = {
  repulsionStrength: 30,
  minDistance: 3.0,
  positionCorrection: 0.9,
  iterations: 8,
  springStrength: 0.3,
  damping: 0.92,
  wanderRadius: 1.0,
  wanderSpeed: 0.08,
  angularDamping: 0.96,
  torqueOnCollision: 0.2,
};

// Stub useControls - returns flattened default values
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
