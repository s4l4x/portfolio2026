uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uTime;
uniform float uScroll;
uniform vec2 uResolution;

varying vec2 vUv;

// 3D Signed Distance Functions
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float sdCone(vec3 p, vec2 c, float h) {
  // c is the sin/cos of the angle, h is height
  vec2 q = h * vec2(c.x / c.y, -1.0);
  vec2 w = vec2(length(p.xz), p.y);
  vec2 a = w - q * clamp(dot(w, q) / dot(q, q), 0.0, 1.0);
  vec2 b = w - q * vec2(clamp(w.x / q.x, 0.0, 1.0), 1.0);
  float k = sign(q.y);
  float d = min(dot(a, a), dot(b, b));
  float s = max(k * (w.x * q.y - w.y * q.x), k * (w.y - q.y));
  return sqrt(d) * sign(s);
}

float sdOctahedron(vec3 p, float s) {
  p = abs(p);
  return (p.x + p.y + p.z - s) * 0.57735027;
}

// Rotation matrices
mat3 rotateY(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

mat3 rotateX(float a) {
  float c = cos(a), s = sin(a);
  return mat3(1, 0, 0, 0, c, -s, 0, s, c);
}

mat3 rotateZ(float a) {
  float c = cos(a), s = sin(a);
  return mat3(c, -s, 0, s, c, 0, 0, 0, 1);
}

// Smooth minimum for blending shapes
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

// Scene distance function
struct SceneResult {
  float dist;
  int id;
};

SceneResult scene(vec3 p) {
  float t = uTime;
  float s = uScroll;

  // Drift offsets for each shape
  vec3 drift1 = vec3(sin(t * 0.15) * 0.3, cos(t * 0.12) * 0.2, sin(t * 0.1) * 0.1);
  vec3 drift2 = vec3(sin(t * 0.18 + 1.0) * 0.4, cos(t * 0.14 + 2.0) * 0.3, cos(t * 0.13) * 0.15);
  vec3 drift3 = vec3(sin(t * 0.22 + 2.0) * 0.35, cos(t * 0.19 + 1.0) * 0.25, sin(t * 0.11 + 1.0) * 0.12);
  vec3 drift4 = vec3(sin(t * 0.2 + 3.0) * 0.45, cos(t * 0.16 + 3.0) * 0.35, cos(t * 0.09 + 2.0) * 0.18);

  // Large sphere - far layer (slow parallax)
  vec3 p1 = p - vec3(3.0, -2.0 + s * 1.5, -8.0) - drift1;
  p1 = rotateY(t * 0.1) * p1;
  float sphere1 = sdSphere(p1, 2.5);

  // Cube - mid layer
  vec3 p2 = p - vec3(-2.5, 1.5 + s * 2.5, -6.0) - drift2;
  p2 = rotateY(t * 0.15) * rotateX(t * 0.12) * p2;
  float cube = sdBox(p2, vec3(1.2));

  // Cone - near layer
  vec3 p3 = p - vec3(1.5, 3.0 + s * 4.0, -5.0) - drift3;
  p3 = rotateX(3.14159) * p3; // Flip cone to point down
  p3 = rotateY(t * 0.2) * p3;
  float cone = sdCone(p3, vec2(0.5, 0.866), 1.8);

  // Small sphere - accent
  vec3 p4 = p - vec3(-3.5, -1.0 + s * 3.5, -4.5) - drift4;
  float sphere2 = sdSphere(p4, 0.9);

  // Octahedron - extra geometric interest
  vec3 p5 = p - vec3(0.0, 0.5 + s * 2.0, -7.0);
  p5 += vec3(sin(t * 0.17) * 0.5, cos(t * 0.13) * 0.4, 0.0);
  p5 = rotateY(t * 0.18) * rotateZ(t * 0.14) * p5;
  float octa = sdOctahedron(p5, 1.5);

  // Find minimum distance and track which shape
  float d = sphere1;
  int id = 0;

  if (cube < d) { d = cube; id = 1; }
  if (cone < d) { d = cone; id = 2; }
  if (sphere2 < d) { d = sphere2; id = 3; }
  if (octa < d) { d = octa; id = 4; }

  return SceneResult(d, id);
}

// Calculate normal via gradient
vec3 calcNormal(vec3 p) {
  const float h = 0.001;
  const vec2 k = vec2(1, -1);
  return normalize(
    k.xyy * scene(p + k.xyy * h).dist +
    k.yyx * scene(p + k.yyx * h).dist +
    k.yxy * scene(p + k.yxy * h).dist +
    k.xxx * scene(p + k.xxx * h).dist
  );
}

// Blend modes
vec3 blendScreen(vec3 base, vec3 blend) {
  return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 blendMultiply(vec3 base, vec3 blend) {
  return base * blend;
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

  // Ray origin and direction
  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3((uv - 0.5) * vec2(aspect, 1.0) * 2.0, -1.0));

  // Base color
  vec3 color = uColorA * 0.25;

  // Ray marching
  float t = 0.0;
  int hitId = -1;

  for (int i = 0; i < 64; i++) {
    vec3 p = ro + rd * t;
    SceneResult res = scene(p);

    if (res.dist < 0.01) {
      hitId = res.id;
      break;
    }

    if (t > 20.0) break;

    t += res.dist;
  }

  // Shading if we hit something
  if (hitId >= 0) {
    vec3 p = ro + rd * t;
    vec3 n = calcNormal(p);

    // Simple lighting
    vec3 lightDir = normalize(vec3(0.5, 1.0, 0.5));
    float diff = max(dot(n, lightDir), 0.0) * 0.5 + 0.5; // Half-lambert

    // Color based on which shape we hit
    vec3 shapeColor;
    if (hitId == 0) {
      // Large sphere - colorA
      shapeColor = uColorA * 1.2;
      color = blendScreen(color, shapeColor * diff);
    } else if (hitId == 1) {
      // Cube - colorB
      shapeColor = uColorB * 1.3;
      color = blendMultiply(color + 0.5, shapeColor * diff);
    } else if (hitId == 2) {
      // Cone - colorC
      shapeColor = uColorC * 1.2;
      color = blendScreen(color, shapeColor * diff);
    } else if (hitId == 3) {
      // Small sphere - colorA
      shapeColor = uColorA * 1.0;
      color = blendOverlay(color, shapeColor * diff);
    } else {
      // Octahedron - mix of colors
      shapeColor = mix(uColorB, uColorC, 0.5) * 1.1;
      color = blendScreen(color, shapeColor * diff);
    }
  }

  gl_FragColor = vec4(color, 1.0);
}
