uniform sampler2D uTexture;
uniform float uSnap;

varying vec2 vUv;
varying float vIndex;

void main() {
  vec4 texColor = texture2D(uTexture, vUv);

  // Slight desaturation when jostling
  float jostleAmount = 1.0 - uSnap;
  vec3 gray = vec3(dot(texColor.rgb, vec3(0.299, 0.587, 0.114)));
  vec3 color = mix(texColor.rgb, gray, jostleAmount * 0.3);

  gl_FragColor = vec4(color, texColor.a);
}
