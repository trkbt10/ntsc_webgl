import { GLSL_COMMON } from "./common";

/**
 * Pass 4: Chroma noise + chroma phase noise + VHS edge wave + chroma loss.
 *
 * Input:  FBO-B (decoded YIQ)
 * Output: FBO-A (YIQ with chroma effects applied)
 */
export const PASS4_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_input;
uniform sampler2D u_edgeWaveTex;
uniform vec2 u_resolution;
uniform float u_chromaNoiseAmount;
uniform float u_chromaPhaseNoise;
uniform float u_chromaLoss;
uniform int u_edgeWaveEnabled;
uniform int u_emulatingVhs;
uniform uint u_frame;

out vec4 fragColor;

void main() {
  ivec2 pos = ivec2(gl_FragCoord.xy);
  uint row = uint(pos.y);

  // VHS edge wave: per-scanline horizontal displacement
  float edgeOffset = 0.0;
  if (u_emulatingVhs > 0 && u_edgeWaveEnabled > 0) {
    edgeOffset = texelFetch(u_edgeWaveTex, ivec2(pos.y / 2, 0), 0).r;
  }

  vec2 sampleUv = v_uv + vec2(edgeOffset / u_resolution.x, 0.0);
  vec3 yiq = texture(u_input, sampleUv).rgb;

  float I = yiq.y;
  float Q = yiq.z;

  // Chroma noise: add random noise to I and Q
  if (u_chromaNoiseAmount > 0.0) {
    float noiseI = hashSigned(uvec3(uint(pos.x), row, u_frame * 2u));
    float noiseQ = hashSigned(uvec3(uint(pos.x), row, u_frame * 2u + 1u));
    // Apply correlated noise approximation: 3-tap horizontal average
    float noiseI2 = hashSigned(uvec3(uint(pos.x) - 1u, row, u_frame * 2u));
    float noiseI3 = hashSigned(uvec3(uint(pos.x) + 1u, row, u_frame * 2u));
    float noiseQ2 = hashSigned(uvec3(uint(pos.x) - 1u, row, u_frame * 2u + 1u));
    float noiseQ3 = hashSigned(uvec3(uint(pos.x) + 1u, row, u_frame * 2u + 1u));
    noiseI = (noiseI + noiseI2 + noiseI3) / 3.0;
    noiseQ = (noiseQ + noiseQ2 + noiseQ3) / 3.0;
    float scale = u_chromaNoiseAmount / 50000.0;
    I += noiseI * scale;
    Q += noiseQ * scale;
  }

  // Chroma phase noise: per-scanline rotation of I/Q
  if (u_chromaPhaseNoise > 0.0) {
    float angle = hashLineSigned(row, u_frame) * u_chromaPhaseNoise * 0.02;
    float cosA = cos(angle);
    float sinA = sin(angle);
    float newI = I * cosA - Q * sinA;
    float newQ = I * sinA + Q * cosA;
    I = newI;
    Q = newQ;
  }

  // Chroma loss: randomly zero out chroma on some scanlines
  if (u_chromaLoss > 0.0) {
    float lossRand = hashLine(row, u_frame + 100u);
    float lossProb = u_chromaLoss / 100000.0;
    if (lossRand < lossProb) {
      I = 0.0;
      Q = 0.0;
    }
  }

  fragColor = vec4(yiq.x, I, Q, 1.0);
}
`;
