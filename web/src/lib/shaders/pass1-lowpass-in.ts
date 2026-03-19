import { GLSL_COMMON } from "./common";

/**
 * Pass 1: Input chroma lowpass — horizontal Gaussian blur on I and Q channels.
 * Y channel passes through unchanged.
 *
 * Input:  FBO-A (YIQ)
 * Output: FBO-B (YIQ with blurred I/Q)
 */
export const PASS1_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_kernelI[25];
uniform float u_kernelQ[25];
uniform int u_radiusI;
uniform int u_radiusQ;
uniform int u_enabled;

out vec4 fragColor;

void main() {
  vec3 yiq = texture(u_input, v_uv).rgb;

  if (u_enabled == 0) {
    fragColor = vec4(yiq, 1.0);
    return;
  }

  float texelX = 1.0 / u_resolution.x;
  int maxR = max(u_radiusI, u_radiusQ);

  float sumI = yiq.y * u_kernelI[0];
  float sumQ = yiq.z * u_kernelQ[0];

  for (int i = 1; i <= 24; i++) {
    if (i > maxR) break;
    vec3 sL = texture(u_input, v_uv + vec2(float(-i) * texelX, 0.0)).rgb;
    vec3 sR = texture(u_input, v_uv + vec2(float( i) * texelX, 0.0)).rgb;

    if (i <= u_radiusI) {
      float wI = u_kernelI[i];
      sumI += (sL.y + sR.y) * wI;
    }
    if (i <= u_radiusQ) {
      float wQ = u_kernelQ[i];
      sumQ += (sL.z + sR.z) * wQ;
    }
  }

  fragColor = vec4(yiq.x, sumI, sumQ, 1.0);
}
`;
