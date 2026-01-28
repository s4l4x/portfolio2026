// SDF Shader Library
// Import these and concatenate with your shader code
// GLSL compilers will optimize out unused functions

import primitives from './primitives.glsl?raw';
import operations from './operations.glsl?raw';
import utils from './utils.glsl?raw';

export { primitives, operations, utils };

// Helper to combine multiple shader chunks
export function combineShaders(...chunks: string[]): string {
  return chunks.join('\n\n');
}

// Example usage:
// import { primitives, operations, combineShaders } from './sdf';
// const shaderHeader = combineShaders(primitives, operations);
// const fullShader = shaderHeader + '\n' + myMainShader;
