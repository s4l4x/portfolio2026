uniform sampler2D uTexture;
uniform float uTime;

varying vec2 vUv;

const float HUE_CYCLE_SPEED = 0.7;

vec3 rgb2hsl(vec3 c) {
  float maxC = max(c.r, max(c.g, c.b));
  float minC = min(c.r, min(c.g, c.b));
  float l = (maxC + minC) / 2.0;

  if (maxC == minC) {
    return vec3(0.0, 0.0, l);
  }

  float d = maxC - minC;
  float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

  float h;
  if (maxC == c.r) {
    h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  } else if (maxC == c.g) {
    h = (c.b - c.r) / d + 2.0;
  } else {
    h = (c.r - c.g) / d + 4.0;
  }
  h /= 6.0;

  return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
  if (t < 1.0 / 2.0) return q;
  if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
  return p;
}

vec3 hsl2rgb(vec3 c) {
  if (c.y == 0.0) {
    return vec3(c.z);
  }

  float q = c.z < 0.5 ? c.z * (1.0 + c.y) : c.z + c.y - c.z * c.y;
  float p = 2.0 * c.z - q;

  float r = hue2rgb(p, q, c.x + 1.0 / 3.0);
  float g = hue2rgb(p, q, c.x);
  float b = hue2rgb(p, q, c.x - 1.0 / 3.0);

  return vec3(r, g, b);
}

void main() {
  vec4 texColor = texture2D(uTexture, vUv);
  vec3 hsl = rgb2hsl(texColor.rgb);

  // Rotate hue over time
  hsl.x = mod(hsl.x + uTime * HUE_CYCLE_SPEED, 1.0);

  vec3 rgb = hsl2rgb(hsl);
  gl_FragColor = vec4(rgb, texColor.a);
}
