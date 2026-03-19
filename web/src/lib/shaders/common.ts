/** Shared fullscreen vertex shader (WebGL 2 / GLSL ES 3.00). */
export const VERTEX_SHADER = `#version 300 es
out vec2 v_uv;
void main() {
  // Fullscreen triangle: 3 vertices cover the entire clip space
  float x = float((gl_VertexID & 1) << 2) - 1.0;
  float y = float((gl_VertexID & 2) << 1) - 1.0;
  // v_uv maps [0,1] across the viewport, regardless of viewport offset/size
  v_uv = vec2(x, y) * 0.5 + 0.5;
  gl_Position = vec4(x, y, 0.0, 1.0);
}
`;

/** GLSL helper block: YIQ <-> RGB conversion + noise hash. Inserted into fragment shaders. */
export const GLSL_COMMON = `
// ---- YIQ <-> RGB ----
const mat3 RGB_TO_YIQ = mat3(
  0.299,  0.5959,  0.2115,
  0.587, -0.2746, -0.5227,
  0.114, -0.3213,  0.3112
);

const mat3 YIQ_TO_RGB = mat3(
  1.0,  1.0,  1.0,
  0.956, -0.272, -1.106,
  0.621, -0.647,  1.703
);

vec3 rgbToYiq(vec3 rgb) {
  return RGB_TO_YIQ * rgb;
}

vec3 yiqToRgb(vec3 yiq) {
  return clamp(YIQ_TO_RGB * yiq, 0.0, 1.0);
}

// ---- Hash-based noise (deterministic per pixel per frame) ----
uint murmur(uint h) {
  h ^= h >> 16u;
  h *= 0x85ebca6bu;
  h ^= h >> 13u;
  h *= 0xc2b2ae35u;
  h ^= h >> 16u;
  return h;
}

uint hash3(uvec3 v) {
  uint h = v.x;
  h ^= v.y * 0x1b873593u;
  h = (h << 13) | (h >> 19);
  h ^= v.z * 0xcc9e2d51u;
  return murmur(h);
}

// Returns value in [0, 1)
float hashFloat(uvec3 v) {
  return float(hash3(v)) / 4294967296.0;
}

// Returns value in [-1, 1)
float hashSigned(uvec3 v) {
  return hashFloat(v) * 2.0 - 1.0;
}

// Per-scanline hash
float hashLine(uint row, uint frame) {
  return hashFloat(uvec3(row, frame, 7919u));
}

float hashLineSigned(uint row, uint frame) {
  return hashLine(row, frame) * 2.0 - 1.0;
}
`;
