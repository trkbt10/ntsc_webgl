import { GLSL_COMMON } from "./common";

/**
 * Pass 0: RGB → YIQ + color bleed (before encode).
 *
 * Input:  source texture (RGBA8 from video/image, Y-flipped at upload)
 * Output: FBO-A (RGBA16F) with YIQ in rgb channels
 */
export const PASS0_FRAGMENT = `#version 300 es
precision highp float;

${GLSL_COMMON}

in vec2 v_uv;

uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform float u_colorBleedH;
uniform float u_colorBleedV;

out vec4 fragColor;

void main() {
  vec2 texel = 1.0 / u_resolution;

  // Flip Y when sampling the source texture: image/video data has top-left
  // origin but GL textures have bottom-left origin.
  vec2 srcUv = vec2(v_uv.x, 1.0 - v_uv.y);

  vec3 rgb = texture(u_source, srcUv).rgb;
  vec3 yiq = rgbToYiq(rgb);

  // Color bleed (before): box-blur I/Q channels
  float bleedH = u_colorBleedH;
  float bleedV = u_colorBleedV;

  if (bleedH > 0.0 || bleedV > 0.0) {
    int rangeH = int(bleedH);
    int rangeV = int(bleedV);
    float fracH = fract(bleedH);
    float fracV = fract(bleedV);

    float sumI = 0.0;
    float sumQ = 0.0;
    float count = 0.0;

    for (int dy = -rangeV; dy <= rangeV; dy++) {
      float wy = (abs(dy) == rangeV && fracV > 0.0) ? fracV : 1.0;
      if (dy != 0 && bleedV <= 0.0) continue;
      for (int dx = -rangeH; dx <= rangeH; dx++) {
        float wx = (abs(dx) == rangeH && fracH > 0.0) ? fracH : 1.0;
        if (dx != 0 && bleedH <= 0.0) continue;
        float w = wx * wy;
        // Note: dy is negated because srcUv has flipped Y
        vec2 sampleUv = srcUv + vec2(float(dx), float(-dy)) * texel;
        vec3 s = rgbToYiq(texture(u_source, sampleUv).rgb);
        sumI += s.y * w;
        sumQ += s.z * w;
        count += w;
      }
    }

    yiq.y = sumI / count;
    yiq.z = sumQ / count;
  }

  fragColor = vec4(yiq, 1.0);
}
`;
