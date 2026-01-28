// Shader Utilities - Blend modes, color functions, easing, noise
// MIT License

// ============================================================================
// BLEND MODES
// ============================================================================

vec3 blendNormal(vec3 base, vec3 blend) {
  return blend;
}

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

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return mix(
    2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
    sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
    step(0.5, blend)
  );
}

vec3 blendHardLight(vec3 base, vec3 blend) {
  return blendOverlay(blend, base);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
  return base / (1.0 - blend + 0.0001);
}

vec3 blendColorBurn(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) / (blend + 0.0001);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
  return base + blend;
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
  return base + blend - 1.0;
}

vec3 blendDarken(vec3 base, vec3 blend) {
  return min(base, blend);
}

vec3 blendLighten(vec3 base, vec3 blend) {
  return max(base, blend);
}

vec3 blendDifference(vec3 base, vec3 blend) {
  return abs(base - blend);
}

vec3 blendExclusion(vec3 base, vec3 blend) {
  return base + blend - 2.0 * base * blend;
}

vec3 blendAdd(vec3 base, vec3 blend) {
  return min(base + blend, vec3(1.0));
}

vec3 blendSubtract(vec3 base, vec3 blend) {
  return max(base - blend, vec3(0.0));
}

// ============================================================================
// COLOR FUNCTIONS
// ============================================================================

// HSV to RGB conversion
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// RGB to HSV conversion
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// Hue rotation
vec3 hueRotate(vec3 col, float shift) {
  vec3 hsv = rgb2hsv(col);
  hsv.x = fract(hsv.x + shift);
  return hsv2rgb(hsv);
}

// Saturation adjustment
vec3 saturate(vec3 col, float amount) {
  vec3 hsv = rgb2hsv(col);
  hsv.y *= amount;
  return hsv2rgb(hsv);
}

// IQ's cosine palette - http://iquilezles.org/articles/palettes
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

// Simple rainbow palette
vec3 rainbow(float t) {
  return palette(t,
    vec3(0.5, 0.5, 0.5),
    vec3(0.5, 0.5, 0.5),
    vec3(1.0, 1.0, 1.0),
    vec3(0.0, 0.33, 0.67));
}

// Sunset palette
vec3 sunset(float t) {
  return palette(t,
    vec3(0.5, 0.5, 0.5),
    vec3(0.5, 0.5, 0.5),
    vec3(1.0, 1.0, 0.5),
    vec3(0.8, 0.9, 0.3));
}

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

float easeInQuad(float t) { return t * t; }
float easeOutQuad(float t) { return t * (2.0 - t); }
float easeInOutQuad(float t) { return t < 0.5 ? 2.0 * t * t : -1.0 + (4.0 - 2.0 * t) * t; }

float easeInCubic(float t) { return t * t * t; }
float easeOutCubic(float t) { float t1 = t - 1.0; return t1 * t1 * t1 + 1.0; }
float easeInOutCubic(float t) { return t < 0.5 ? 4.0 * t * t * t : (t - 1.0) * (2.0 * t - 2.0) * (2.0 * t - 2.0) + 1.0; }

float easeInExpo(float t) { return t == 0.0 ? 0.0 : pow(2.0, 10.0 * (t - 1.0)); }
float easeOutExpo(float t) { return t == 1.0 ? 1.0 : 1.0 - pow(2.0, -10.0 * t); }

float easeInSine(float t) { return 1.0 - cos(t * 1.5707963); }
float easeOutSine(float t) { return sin(t * 1.5707963); }
float easeInOutSine(float t) { return 0.5 * (1.0 - cos(3.1415926 * t)); }

float easeInElastic(float t) {
  return sin(13.0 * 1.5707963 * t) * pow(2.0, 10.0 * (t - 1.0));
}
float easeOutElastic(float t) {
  return sin(-13.0 * 1.5707963 * (t + 1.0)) * pow(2.0, -10.0 * t) + 1.0;
}

float easeOutBounce(float t) {
  if (t < 1.0/2.75) return 7.5625 * t * t;
  else if (t < 2.0/2.75) { t -= 1.5/2.75; return 7.5625 * t * t + 0.75; }
  else if (t < 2.5/2.75) { t -= 2.25/2.75; return 7.5625 * t * t + 0.9375; }
  else { t -= 2.625/2.75; return 7.5625 * t * t + 0.984375; }
}

float easeInBounce(float t) { return 1.0 - easeOutBounce(1.0 - t); }

// Smoothstep variants
float smootherstep(float edge0, float edge1, float x) {
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

// ============================================================================
// NOISE FUNCTIONS
// ============================================================================

// Hash functions
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
  p3 = fract(p3 * 0.1031);
  p3 += dot(p3, p3.zyx + 31.32);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 hash33(vec3 p3) {
  p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
  p3 += dot(p3, p3.yxz + 33.33);
  return fract((p3.xxy + p3.yxx) * p3.zyx);
}

// Value noise 2D
float noise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash12(i + vec2(0, 0)), hash12(i + vec2(1, 0)), f.x),
    mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x),
    f.y
  );
}

// Value noise 3D
float noise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash13(i + vec3(0, 0, 0)), hash13(i + vec3(1, 0, 0)), f.x),
      mix(hash13(i + vec3(0, 1, 0)), hash13(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash13(i + vec3(0, 0, 1)), hash13(i + vec3(1, 0, 1)), f.x),
      mix(hash13(i + vec3(0, 1, 1)), hash13(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

// FBM (Fractal Brownian Motion)
float fbm(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < octaves; i++) {
    value += amplitude * noise2D(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

float fbm3D(vec3 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < octaves; i++) {
    value += amplitude * noise3D(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

// ============================================================================
// UTILITY MATH
// ============================================================================

// Remap value from one range to another
float remap(float value, float inMin, float inMax, float outMin, float outMax) {
  return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

// Remap with clamping
float remapClamp(float value, float inMin, float inMax, float outMin, float outMax) {
  float t = clamp((value - inMin) / (inMax - inMin), 0.0, 1.0);
  return mix(outMin, outMax, t);
}

// Bias function (attempt at gamma curve)
float bias(float t, float b) {
  return pow(t, log(b) / log(0.5));
}

// Gain function (attempt at S-curve)
float gain(float t, float g) {
  if (t < 0.5)
    return bias(t * 2.0, g) / 2.0;
  else
    return 1.0 - bias((1.0 - t) * 2.0, g) / 2.0;
}

// Pulse function - 1 in range [a,b], 0 outside
float pulse(float a, float b, float x) {
  return step(a, x) - step(b, x);
}

// Smooth pulse
float smoothPulse(float a, float b, float k, float x) {
  return smoothstep(a - k, a + k, x) - smoothstep(b - k, b + k, x);
}
