import { GLSL_COMMON } from "./common";

/**
 * Pass 6: YIQ → RGB final output.
 *
 * Converts processed YIQ back to RGB and outputs to screen.
 * Uses v_uv from vertex shader so letterbox viewport is handled correctly.
 *
 * Input:  FBO-B (final YIQ)
 * Output: Screen (default framebuffer)
 */
export const PASS6_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_input;

out vec4 fragColor;

void main() {
  vec3 yiq = texture(u_input, v_uv).rgb;
  vec3 rgb = yiqToRgb(yiq);
  fragColor = vec4(rgb, 1.0);
}
`;
