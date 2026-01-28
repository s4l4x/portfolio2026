uniform float uTime;
uniform float uSnap;
uniform vec2 uGridSize;
uniform vec2 uTileSize;
uniform vec2 uUvScale;   // Scale for object-fit: cover
uniform vec2 uUvOffset;  // Offset for centering

attribute vec2 aUvOffset;
attribute float aIndex;

varying vec2 vUv;
varying float vIndex;

// Simple noise function
float hash(float n) {
  return fract(sin(n) * 43758.5453123);
}

float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(hash(i), hash(i + 1.0), smoothstep(0.0, 1.0, f));
}

void main() {
  // Apply cover scaling: scale and offset the base UV coordinates
  vec2 baseUv = uv * uTileSize + aUvOffset;
  vUv = baseUv * uUvScale + uUvOffset;
  vIndex = aIndex;

  // Get instance transform
  vec4 worldPos = instanceMatrix * vec4(position, 1.0);

  // Jostling offset when not snapped
  float jostleAmount = 1.0 - uSnap;
  float seed = aIndex * 1.7;

  // Noise-based jostling - small offsets in world space
  float offsetX = (noise(uTime * 2.0 + seed) - 0.5) * 0.03 * jostleAmount;
  float offsetY = (noise(uTime * 2.3 + seed + 100.0) - 0.5) * 0.03 * jostleAmount;
  float offsetZ = (noise(uTime * 1.8 + seed + 200.0) - 0.5) * 0.01 * jostleAmount;

  // Slight rotation when jostling
  float rotZ = (noise(uTime * 1.5 + seed + 300.0) - 0.5) * 0.3 * jostleAmount;

  worldPos.x += offsetX;
  worldPos.y += offsetY;
  worldPos.z += offsetZ;

  vec4 mvPosition = modelViewMatrix * worldPos;
  gl_Position = projectionMatrix * mvPosition;
}
