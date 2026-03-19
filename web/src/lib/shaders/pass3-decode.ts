import { GLSL_COMMON } from "./common";

/**
 * Pass 3: VHS head switching + composite decode.
 *
 * Decodes composite NTSC signal back to YIQ using a 4-sample box filter.
 * Extracts luma by averaging, and chroma by multiplying with reference carrier.
 *
 * Input:  FBO-A (composite in R)
 * Output: FBO-B (decoded YIQ)
 */
export const PASS3_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform int u_scanlinePhaseShift;
uniform int u_headSwitchingEnabled;
uniform int u_emulatingVhs;
uniform float u_headSwitchShift;
uniform uint u_frame;

out vec4 fragColor;

void main() {
  ivec2 pos = ivec2(gl_FragCoord.xy);
  int x = pos.x;
  int y = pos.y;
  int height = int(u_resolution.y);
  float texelX = 1.0 / u_resolution.x;

  // VHS head switching: shift bottom ~4 scanlines horizontally
  float hsOffset = 0.0;
  if (u_emulatingVhs > 0 && u_headSwitchingEnabled > 0) {
    int hsLines = 4;
    int fromBottom = height - 1 - y;
    if (fromBottom < hsLines) {
      float t = 1.0 - float(fromBottom) / float(hsLines);
      hsOffset = u_headSwitchShift * t * t;
    }
  }

  // 4-sample box decode
  float sumY = 0.0;
  float sumI = 0.0;
  float sumQ = 0.0;

  int phaseOffset = y * u_scanlinePhaseShift;

  for (int k = -1; k <= 2; k++) {
    float offsetX = (float(k) + hsOffset) * texelX;
    float composite = texture(u_input, v_uv + vec2(offsetX, 0.0)).r;

    sumY += composite;

    float phase = float((x + k) * 2 + phaseOffset) * (3.14159265 / 4.0);
    sumI += composite * cos(phase);
    sumQ += composite * sin(phase);
  }

  float Y = sumY / 4.0;
  float I = sumI / 2.0;
  float Q = sumQ / 2.0;

  fragColor = vec4(Y, I, Q, 1.0);
}
`;
