uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uTime;
uniform float uScroll;
uniform vec2 uResolution;

varying vec2 vUv;

// Signed distance function for circle
float sdCircle(vec2 p, vec2 center, float radius) {
  return length(p - center) - radius;
}

// Blend modes
vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
}

vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend,
    1.0 - 2.0 * (1.0 - base) * (1.0 - blend),
    step(0.5, base)
  );
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);

  // Base color (muted version of colorA)
  vec3 color = uColorA * 0.25;

  // Depth-based parallax - circles at different z-depths
  // Closer = more parallax, farther = less parallax
  // Positive scroll moves circles up (same direction as content)
  float s = uScroll;
  float t = uTime;

  // Subtle drift offsets - each circle drifts on its own path
  vec2 drift1 = vec2(sin(t * 0.15) * 0.02, cos(t * 0.12) * 0.015);
  vec2 drift2 = vec2(sin(t * 0.18 + 1.0) * 0.025, cos(t * 0.14 + 2.0) * 0.02);
  vec2 drift3 = vec2(sin(t * 0.22 + 2.0) * 0.03, cos(t * 0.19 + 1.0) * 0.025);
  vec2 drift4 = vec2(sin(t * 0.2 + 3.0) * 0.035, cos(t * 0.16 + 3.0) * 0.03);

  // Far layer (slow parallax) - large background circle
  vec2 c1Pos = vec2(0.8 * aspect, 0.2 + s * 0.08) + drift1;
  float c1 = sdCircle(p, c1Pos, 0.45);

  // Mid layer (medium parallax)
  vec2 c2Pos = vec2(0.25 * aspect, 0.7 + s * 0.15) + drift2;
  float c2 = sdCircle(p, c2Pos, 0.28);

  // Near layer (more parallax) - smaller accent circles
  vec2 c3Pos = vec2(0.6 * aspect, 0.85 + s * 0.25) + drift3;
  float c3 = sdCircle(p, c3Pos, 0.15);

  vec2 c4Pos = vec2(0.1 * aspect, 0.15 + s * 0.22) + drift4;
  float c4 = sdCircle(p, c4Pos, 0.12);

  // Compositing with blend modes
  if (c1 < 0.0) {
    color = blendScreen(color, uColorA * 1.2);
  }
  if (c2 < 0.0) {
    color = blendMultiply(color + 0.5, uColorB * 1.3);
  }
  if (c3 < 0.0) {
    color = blendScreen(color, uColorC * 1.2);
  }
  if (c4 < 0.0) {
    color = blendOverlay(color, uColorA * 1.0);
  }

  gl_FragColor = vec4(color, 1.0);
}
