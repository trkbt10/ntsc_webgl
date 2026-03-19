import { GLSL_COMMON } from "./common";

/**
 * Pass 5: VHS luma/chroma lowpass + sharpen + output chroma lowpass +
 *         chroma blur + color bleed (after).
 *
 * Input:  FBO-A (YIQ after chroma FX)
 * Output: FBO-B (YIQ ready for final RGB conversion)
 */
export const PASS5_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_resolution;

// VHS lowpass kernels
uniform float u_vhsLumaKernel[25];
uniform float u_vhsChromaKernel[25];
uniform int u_vhsLumaRadius;
uniform int u_vhsChromaRadius;

// Output chroma lowpass kernel
uniform float u_outChromaKernel[25];
uniform int u_outChromaRadius;

uniform float u_sharpenAmount;
uniform int u_emulatingVhs;
uniform int u_outputLowpassEnabled;
uniform float u_colorBleedH;
uniform float u_colorBleedV;

out vec4 fragColor;

void main() {
  float texelX = 1.0 / u_resolution.x;
  vec2 texel = 1.0 / u_resolution;

  vec3 yiq = texture(u_input, v_uv).rgb;
  float Y = yiq.x;
  float I = yiq.y;
  float Q = yiq.z;

  // VHS luma/chroma lowpass (only when emulating VHS)
  if (u_emulatingVhs > 0) {
    // Luma lowpass
    float sumY = Y * u_vhsLumaKernel[0];
    for (int i = 1; i <= 24; i++) {
      if (i > u_vhsLumaRadius) break;
      float yL = texture(u_input, v_uv + vec2(float(-i) * texelX, 0.0)).x;
      float yR = texture(u_input, v_uv + vec2(float( i) * texelX, 0.0)).x;
      sumY += (yL + yR) * u_vhsLumaKernel[i];
    }

    // Sharpen: boost high frequencies in luma
    if (u_sharpenAmount > 1.0) {
      Y = Y + (Y - sumY) * (u_sharpenAmount - 1.0);
    } else {
      Y = sumY;
    }

    // Chroma lowpass
    float sumI = I * u_vhsChromaKernel[0];
    float sumQ = Q * u_vhsChromaKernel[0];
    for (int i = 1; i <= 24; i++) {
      if (i > u_vhsChromaRadius) break;
      vec3 sL = texture(u_input, v_uv + vec2(float(-i) * texelX, 0.0)).rgb;
      vec3 sR = texture(u_input, v_uv + vec2(float( i) * texelX, 0.0)).rgb;
      sumI += (sL.y + sR.y) * u_vhsChromaKernel[i];
      sumQ += (sL.z + sR.z) * u_vhsChromaKernel[i];
    }
    I = sumI;
    Q = sumQ;
  }

  // Output chroma lowpass
  if (u_outputLowpassEnabled > 0) {
    float sumI2 = I * u_outChromaKernel[0];
    float sumQ2 = Q * u_outChromaKernel[0];
    for (int i = 1; i <= 24; i++) {
      if (i > u_outChromaRadius) break;
      vec3 sL = texture(u_input, v_uv + vec2(float(-i) * texelX, 0.0)).rgb;
      vec3 sR = texture(u_input, v_uv + vec2(float( i) * texelX, 0.0)).rgb;
      sumI2 += (sL.y + sR.y) * u_outChromaKernel[i];
      sumQ2 += (sL.z + sR.z) * u_outChromaKernel[i];
    }
    I = sumI2;
    Q = sumQ2;
  }

  // Color bleed (after decode): box-blur I/Q
  if (u_colorBleedH > 0.0 || u_colorBleedV > 0.0) {
    int rangeH = int(u_colorBleedH);
    int rangeV = int(u_colorBleedV);

    float bleedI = 0.0;
    float bleedQ = 0.0;
    float count = 0.0;

    for (int dy = -rangeV; dy <= rangeV; dy++) {
      if (dy != 0 && u_colorBleedV <= 0.0) continue;
      for (int dx = -rangeH; dx <= rangeH; dx++) {
        if (dx != 0 && u_colorBleedH <= 0.0) continue;
        vec2 sampleUv = v_uv + vec2(float(dx), float(dy)) * texel;
        vec3 s = texture(u_input, sampleUv).rgb;
        bleedI += s.y;
        bleedQ += s.z;
        count += 1.0;
      }
    }
    if (count > 0.0) {
      I = bleedI / count;
      Q = bleedQ / count;
    }
  }

  fragColor = vec4(Y, I, Q, 1.0);
}
`;
