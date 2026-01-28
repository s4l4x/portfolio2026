// The MIT License
// Copyright 2013 Inigo Quilez
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions: The above copyright
// notice and this permission notice shall be included in all copies or
// substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
// WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
// TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
// FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
// TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
// THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// SDF Operations from https://iquilezles.org/articles/distfunctions

// ============================================================================
// BOOLEAN OPERATIONS
// ============================================================================

float opUnion(float d1, float d2) {
  return min(d1, d2);
}

float opSubtraction(float d1, float d2) {
  return max(-d1, d2);
}

float opIntersection(float d1, float d2) {
  return max(d1, d2);
}

float opXor(float d1, float d2) {
  return max(min(d1, d2), -max(d1, d2));
}

// ============================================================================
// SMOOTH BOOLEAN OPERATIONS
// ============================================================================

// Smooth union - k controls smoothness (try k=0.1)
float opSmoothUnion(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

// Smooth subtraction
float opSmoothSubtraction(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
  return mix(d2, -d1, h) + k * h * (1.0 - h);
}

// Smooth intersection
float opSmoothIntersection(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) + k * h * (1.0 - h);
}

// ============================================================================
// SMOOTH BOOLEAN WITH COLOR BLEND
// Returns vec2(distance, blend factor for material mixing)
// ============================================================================

vec2 opSmoothUnionCol(float d1, float d2, float k) {
  float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return vec2(mix(d2, d1, h) - k * h * (1.0 - h), h);
}

vec2 opSmoothSubtractionCol(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
  return vec2(mix(d2, -d1, h) + k * h * (1.0 - h), h);
}

vec2 opSmoothIntersectionCol(float d1, float d2, float k) {
  float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return vec2(mix(d2, d1, h) + k * h * (1.0 - h), h);
}

// ============================================================================
// DOMAIN OPERATIONS - POSITIONING
// ============================================================================

// Apply to point before evaluating SDF
vec3 opTranslate(vec3 p, vec3 offset) {
  return p - offset;
}

// ============================================================================
// ROTATION MATRICES
// ============================================================================

mat2 rot2D(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

mat3 rotateX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1, 0, 0, 0, c, -s, 0, s, c);
}

mat3 rotateY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

mat3 rotateZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0, s, c, 0, 0, 0, 1);
}

// Rotate around arbitrary axis (normalized)
mat3 rotateAxis(vec3 axis, float a) {
  float c = cos(a), s = sin(a);
  float t = 1.0 - c;
  return mat3(
    t * axis.x * axis.x + c,
    t * axis.x * axis.y - s * axis.z,
    t * axis.x * axis.z + s * axis.y,
    t * axis.x * axis.y + s * axis.z,
    t * axis.y * axis.y + c,
    t * axis.y * axis.z - s * axis.x,
    t * axis.x * axis.z - s * axis.y,
    t * axis.y * axis.z + s * axis.x,
    t * axis.z * axis.z + c
  );
}

// ============================================================================
// DOMAIN OPERATIONS - REPETITION
// ============================================================================

// Infinite repetition
vec3 opRep(vec3 p, vec3 c) {
  return mod(p + 0.5 * c, c) - 0.5 * c;
}

// Limited repetition - only n copies in each direction
vec3 opRepLim(vec3 p, float c, vec3 l) {
  return p - c * clamp(round(p / c), -l, l);
}

// 1D repetition along X axis
float opRepX(inout vec3 p, float c) {
  float id = round(p.x / c);
  p.x = mod(p.x + 0.5 * c, c) - 0.5 * c;
  return id;
}

// 1D repetition along Y axis
float opRepY(inout vec3 p, float c) {
  float id = round(p.y / c);
  p.y = mod(p.y + 0.5 * c, c) - 0.5 * c;
  return id;
}

// 1D repetition along Z axis
float opRepZ(inout vec3 p, float c) {
  float id = round(p.z / c);
  p.z = mod(p.z + 0.5 * c, c) - 0.5 * c;
  return id;
}

// Polar/radial repetition around Y axis
vec3 opRepPolar(vec3 p, float n) {
  float angle = 3.14159265 / n;
  float a = atan(p.z, p.x) + angle;
  float r = length(p.xz);
  a = mod(a, 2.0 * angle) - angle;
  return vec3(r * cos(a), p.y, r * sin(a));
}

// ============================================================================
// DOMAIN OPERATIONS - SYMMETRY
// ============================================================================

// Mirror across YZ plane (X symmetry)
vec3 opSymX(vec3 p) {
  p.x = abs(p.x);
  return p;
}

// Mirror across XZ plane (Y symmetry)
vec3 opSymY(vec3 p) {
  p.y = abs(p.y);
  return p;
}

// Mirror across XY plane (Z symmetry)
vec3 opSymZ(vec3 p) {
  p.z = abs(p.z);
  return p;
}

// Mirror across all three planes
vec3 opSymXYZ(vec3 p) {
  return abs(p);
}

// ============================================================================
// DOMAIN OPERATIONS - DEFORMATIONS
// ============================================================================

// Twist around Y axis
vec3 opTwist(vec3 p, float k) {
  float c = cos(k * p.y);
  float s = sin(k * p.y);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * p.xz, p.y);
}

// Cheap bend around Y axis
vec3 opCheapBend(vec3 p, float k) {
  float c = cos(k * p.x);
  float s = sin(k * p.x);
  mat2 m = mat2(c, -s, s, c);
  return vec3(m * p.xy, p.z);
}

// ============================================================================
// DISTANCE OPERATIONS - MODIFICATIONS
// ============================================================================

// Round (expand by radius r)
float opRound(float d, float r) {
  return d - r;
}

// Onion (hollow shell with thickness r)
float opOnion(float d, float r) {
  return abs(d) - r;
}

// Multiple onion layers
float opOnionN(float d, float r, int n) {
  for (int i = 0; i < n; i++) {
    d = abs(d) - r;
  }
  return d;
}

// Extrusion of 2D shape along Z
float opExtrusion(float d2d, vec3 p, float h) {
  vec2 w = vec2(d2d, abs(p.z) - h);
  return min(max(w.x, w.y), 0.0) + length(max(w, 0.0));
}

// Revolution of 2D shape around Y axis
float opRevolution(vec2 p2d, vec3 p, float o) {
  return length(vec2(length(p.xz) - o, p.y)) - length(p2d);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Elongate shape - stretch center by h
vec3 opElongate(vec3 p, vec3 h) {
  return p - clamp(p, -h, h);
}

// Elongate with proper distance (more expensive)
vec4 opElongateExact(vec3 p, vec3 h) {
  vec3 q = abs(p) - h;
  return vec4(max(q, 0.0), min(max(q.x, max(q.y, q.z)), 0.0));
}

// Displacement (add noise to surface)
float opDisplace(float d, vec3 p, float amount) {
  float disp = sin(20.0 * p.x) * sin(20.0 * p.y) * sin(20.0 * p.z);
  return d + disp * amount;
}

// Scale uniformly (remember to divide result by s)
vec3 opScale(vec3 p, float s) {
  return p / s;
}

// ============================================================================
// RAY MARCHING HELPERS
// ============================================================================

// Box intersection for bounding volume optimization
vec2 iBox(vec3 ro, vec3 rd, vec3 rad) {
  vec3 m = 1.0 / rd;
  vec3 n = m * ro;
  vec3 k = abs(m) * rad;
  vec3 t1 = -n - k;
  vec3 t2 = -n + k;
  return vec2(max(max(t1.x, t1.y), t1.z),
              min(min(t2.x, t2.y), t2.z));
}

// Sphere intersection for bounding volume optimization
vec2 iSphere(vec3 ro, vec3 rd, float r) {
  float b = dot(ro, rd);
  float c = dot(ro, ro) - r * r;
  float h = b * b - c;
  if (h < 0.0) return vec2(-1.0);
  h = sqrt(h);
  return vec2(-b - h, -b + h);
}

// Normal calculation via gradient (tetrahedron technique)
vec3 calcNormalTet(vec3 p, float h, float sceneDist) {
  const vec2 k = vec2(1, -1);
  // Note: You need to replace sceneDist with actual scene(p + ...) calls
  // This is just a template showing the pattern
  return normalize(
    k.xyy * sceneDist +
    k.yyx * sceneDist +
    k.yxy * sceneDist +
    k.xxx * sceneDist
  );
}

// Soft shadow calculation
float calcSoftshadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 64 && t < maxt; i++) {
    // Note: Replace 0.001 with your scene(ro + rd*t) call
    float h = 0.001;
    res = min(res, k * h / t);
    t += clamp(h, 0.01, 0.2);
    if (res < 0.001) break;
  }
  return clamp(res, 0.0, 1.0);
}

// Ambient occlusion
float calcAO(vec3 pos, vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.01 + 0.12 * float(i) / 4.0;
    // Note: Replace 0.0 with your scene(pos + h*nor) call
    float d = 0.0;
    occ += (h - d) * sca;
    sca *= 0.95;
  }
  return clamp(1.0 - 3.0 * occ, 0.0, 1.0);
}
