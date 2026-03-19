///|
/// Convert interleaved RGBA (browser format) to planar int32 YIQ.
/// Values are scaled by 256 for fixed-point arithmetic.
pub fn rgba2yiq(
  rgba : FixedArray[Byte],
  width : Int,
  height : Int,
  yiq : YiqFrame,
) -> Unit {
  let data = yiq.data
  let hw = height * width
  for row in 0..<height {
    let row_off = row * width
    let y_base = row_off
    let i_base = hw + row_off
    let q_base = hw + hw + row_off
    let mut idx = row_off * 4
    for col in 0..<width {
      let r = rgba[idx].to_int().to_double()
      let g = rgba[idx + 1].to_int().to_double()
      let b = rgba[idx + 2].to_int().to_double()
      let dy = 0.30 * r + 0.59 * g + 0.11 * b
      data[y_base + col] = (dy * 256.0).to_int()
      data[i_base + col] = (256.0 * (-0.27 * (b - dy) + 0.74 * (r - dy))).to_int()
      data[q_base + col] = (256.0 * (0.41 * (b - dy) + 0.48 * (r - dy))).to_int()
      idx = idx + 4
    }
  }
}

///|
/// Convert one field of planar int32 YIQ to interleaved RGBA.
/// Writes only the scanlines belonging to the specified field (0=even, 1=odd).
pub fn yiq2rgba(yiq : YiqFrame, field : Int, dst : FixedArray[Byte]) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let hw = height * width
  for row = field; row < height; row = row + 2 {
    let row_off = row * width
    let y_off = row_off
    let i_off = hw + row_off
    let q_off = hw + hw + row_off
    let mut idx = row_off * 4
    for col in 0..<width {
      let y_val = data[y_off + col].to_double()
      let i_val = data[i_off + col].to_double()
      let q_val = data[q_off + col].to_double()
      let r = ((1.000 * y_val + 0.956 * i_val + 0.621 * q_val) / 256.0).to_int()
      let g = ((1.000 * y_val + -0.272 * i_val + -0.647 * q_val) / 256.0).to_int()
      let b = ((1.000 * y_val + -1.106 * i_val + 1.703 * q_val) / 256.0).to_int()
      dst[idx] = r.clamp(min=0, max=255).to_byte()
      dst[idx + 1] = g.clamp(min=0, max=255).to_byte()
      dst[idx + 2] = b.clamp(min=0, max=255).to_byte()
      dst[idx + 3] = b'\xFF'
      idx = idx + 4
    }
  }
}
