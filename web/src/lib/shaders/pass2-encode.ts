import { GLSL_COMMON } from "./common";

/**
 * Pass 2: Composite encode + preemphasis + luma noise.
 *
 * Encodes YIQ into a composite NTSC signal using QAM modulation.
 * The composite value is stored in the R channel; G and B are unused.
 *
 * Input:  FBO-B (YIQ after input lowpass)
 * Output: FBO-A (composite signal in R, original I/Q in G/B for reference)
 */
export const PASS2_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_input;
uniform vec2 u_resolution;
uniform float u_subcarrierAmplitude;
uniform float u_preemphasis;
uniform float u_lumaNoiseAmount;
uniform uint u_frame;
uniform int u_scanlinePhaseShift; // 0=0, 1=90, 2=180, 3=270 degrees

out vec4 fragColor;

void main() {
  ivec2 pos = ivec2(gl_FragCoord.xy);
  float texelX = 1.0 / u_resolution.x;

  vec3 yiq = texture(u_input, v_uv).rgb;
  float Y = yiq.x;
  float I = yiq.y;
  float Q = yiq.z;

  // Preemphasis: highpass boost on luma
  if (u_preemphasis > 0.0) {
    float yL = texture(u_input, v_uv + vec2(-texelX, 0.0)).x;
    float yR = texture(u_input, v_uv + vec2( texelX, 0.0)).x;
    float lowpass = (yL + Y + yR) / 3.0;
    float highpass = Y - lowpass;
    Y += highpass * u_preemphasis;
  }

  // Luma noise
  if (u_lumaNoiseAmount > 0.0) {
    float noise = hashSigned(uvec3(uint(pos.x), uint(pos.y), u_frame));
    Y += noise * u_lumaNoiseAmount / 255.0;
  }

  // Subcarrier phase: pi/2 per pixel (4 samples per cycle)
  // Phase offset per scanline for phase alternation
  int phaseOffset = pos.y * u_scanlinePhaseShift;
  float phase = float(pos.x * 2 + phaseOffset) * (3.14159265 / 4.0);

  // QAM modulation
  float amp = u_subcarrierAmplitude / 100.0;
  float composite = Y + amp * (I * cos(phase) + Q * sin(phase));

  // Store composite in R, keep I/Q in G/B for potential use
  fragColor = vec4(composite, I, Q, 1.0);
}
`;
