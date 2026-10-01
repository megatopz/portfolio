export const vertex = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

export const fragment = /* glsl */ `
precision highp float;
uniform sampler2D uImage;
uniform vec2 uPointer;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform float uTime;
uniform float uIntensity;
uniform float uExposureMin;
uniform float uExposureMax;
uniform float uRadius;
varying vec2 vUv;

vec2 coverUv(vec2 uv) {
  float canvasRatio = uResolution.x / uResolution.y;
  float imageRatio = uImageSize.x / uImageSize.y;
  vec2 scale = canvasRatio > imageRatio
    ? vec2(1.0, imageRatio / canvasRatio)
    : vec2(canvasRatio / imageRatio, 1.0);
  return (uv - 0.5) * scale + 0.5;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 base = texture2D(uImage, coverUv(vUv)).rgb;
  float lum = dot(base, vec3(0.2126, 0.7152, 0.0722));
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  float d = distance(vUv * aspect, uPointer * aspect);
  // 1 at the pointer, 0 from uRadius out (smoothstep with edge0 > edge1 is undefined in GLSL).
  float light = 1.0 - smoothstep(0.0, uRadius, d);
  // uIntensity = 0 reproduces the static image exactly (exposure 1.0)
  float exposure = mix(1.0, mix(uExposureMin, uExposureMax, light), uIntensity);
  float grain = (hash(vUv * uResolution + fract(uTime)) - 0.5) * 0.08 * uIntensity;
  gl_FragColor = vec4(vec3(clamp(lum * exposure + grain, 0.0, 1.0)), 1.0);
}
`;
