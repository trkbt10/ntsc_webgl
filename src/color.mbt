///|
/// Convert interleaved RGBA (browser format) to planar int32 YIQ.
/// Values are scaled by 256 for fixed-point arithmetic.
/// Uses fixed-point integer math (scaled by 65536) to avoid Double conversions.
pub fn rgba2yiq(
  rgba : FixedArray[Byte],
  width : Int,
  height : Int,
  yiq : YiqFrame,
) -> Unit {
  // Fixed-point coefficients (scaled by 65536)
  // Y: 0.30*r + 0.59*g + 0.11*b
  let y_r = 19661 // 0.30 * 65536
  let y_g = 38666 // 0.59 * 65536
  let y_b = 7209 // 0.11 * 65536
  // I: -0.27*(b-y) + 0.74*(r-y) = 0.74*r - 0.27*b - 0.47*y
  //   = 0.74*r - 0.27*b - 0.47*(0.30*r + 0.59*g + 0.11*b)
  //   = (0.74 - 0.141)*r + (-0.2773)*g + (-0.27 - 0.0517)*b
  //   = 0.599*r - 0.2773*g - 0.3217*b
  let i_r = 39256 // 0.599 * 65536
  let i_g = -18170 // -0.2773 * 65536
  let i_b = -21086 // -0.3217 * 65536
  // Q: 0.41*(b-y) + 0.48*(r-y) = 0.48*r - 0.41*y + 0.41*b - 0.48*y + ... hmm
  //   = 0.48*r + 0.41*b - 0.89*y
  //   = 0.48*r + 0.41*b - 0.89*(0.30*r + 0.59*g + 0.11*b)
  //   = (0.48 - 0.267)*r + (-0.5251)*g + (0.41 - 0.0979)*b
  //   = 0.213*r - 0.5251*g + 0.3121*b
  let q_r = 13959 // 0.213 * 65536
  let q_g = -34414 // -0.5251 * 65536
  let q_b = 20455 // 0.3121 * 65536
  let data = yiq.data
  let hw = height * width
  for row in 0..<height {
    let row_off = row * width
    let y_base = row_off
    let i_base = hw + row_off
    let q_base = hw + hw + row_off
    let mut idx = row_off * 4
    for col in 0..<width {
      let r = rgba[idx].to_int()
      let g = rgba[idx + 1].to_int()
      let b = rgba[idx + 2].to_int()
      // Y scaled by 256: (coeff * val) >> 16 gives val*coeff, then * 256 = shift left 8
      // Combined: (coeff * val) >> 8
      data[y_base + col] = (y_r * r + y_g * g + y_b * b) >> 8
      data[i_base + col] = (i_r * r + i_g * g + i_b * b) >> 8
      data[q_base + col] = (q_r * r + q_g * g + q_b * b) >> 8
      idx = idx + 4
    }
  }
}

///|
/// Convert one field of planar int32 YIQ to interleaved RGBA.
/// Writes only the scanlines belonging to the specified field (0=even, 1=odd).
/// Uses fixed-point integer math to avoid Double conversions.
pub fn yiq2rgba(yiq : YiqFrame, field : Int, dst : FixedArray[Byte]) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let hw = height * width
  // Fixed-point coefficients (scaled by 256, since YIQ values are already *256)
  // R = (1.000*Y + 0.956*I + 0.621*Q) / 256
  // G = (1.000*Y - 0.272*I - 0.647*Q) / 256
  // B = (1.000*Y - 1.106*I + 1.703*Q) / 256
  // We need: (coeff * val) / 256 where val is already *256
  // So result = (coeff_fixed * val) >> 16 where coeff_fixed = coeff * 65536/256 = coeff * 256
  // Actually simpler: result = (Y + 0.956*I + 0.621*Q) / 256
  // Use fixed-point scale 256 for coefficients: coeff_fp = (coeff * 256).to_int()
  // Then result = (256*Y + c_i*I + c_q*Q) / (256*256)
  let ri = 245 // 0.956 * 256
  let rq = 159 // 0.621 * 256
  let gi = -70 // -0.272 * 256
  let gq = -166 // -0.647 * 256
  let bi = -283 // -1.106 * 256
  let bq = 436 // 1.703 * 256
  for row = field; row < height; row = row + 2 {
    let row_off = row * width
    let y_off = row_off
    let i_off = hw + row_off
    let q_off = hw + hw + row_off
    let mut idx = row_off * 4
    for col in 0..<width {
      let y_val = data[y_off + col]
      let i_val = data[i_off + col]
      let q_val = data[q_off + col]
      // y_val is already scaled by 256, so y_val * 256 = y_val << 8
      let y256 = y_val << 8
      let r = (y256 + ri * i_val + rq * q_val) >> 16
      let g = (y256 + gi * i_val + gq * q_val) >> 16
      let b = (y256 + bi * i_val + bq * q_val) >> 16
      dst[idx] = clamp_byte(r)
      dst[idx + 1] = clamp_byte(g)
      dst[idx + 2] = clamp_byte(b)
      dst[idx + 3] = b'\xFF'
      idx = idx + 4
    }
  }
}

///|
fn clamp_byte(v : Int) -> Byte {
  if v < 0 {
    b'\x00'
  } else if v > 255 {
    b'\xFF'
  } else {
    v.to_byte()
  }
}
