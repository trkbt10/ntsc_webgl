///|
/// Convert interleaved RGBA (browser format) to planar int32 YIQ.
/// Values are scaled by 256 for fixed-point arithmetic.
pub fn rgba2yiq(
  rgba : FixedArray[Byte],
  width : Int,
  height : Int,
  yiq : YiqFrame,
) -> Unit {
  for row in 0..<height {
    for col in 0..<width {
      let idx = (row * width + col) * 4
      let r = rgba[idx].to_int().to_double()
      let g = rgba[idx + 1].to_int().to_double()
      let b = rgba[idx + 2].to_int().to_double()
      let dy = 0.30 * r + 0.59 * g + 0.11 * b
      let y_val = (dy * 256.0).to_int()
      let i_val = (256.0 * (-0.27 * (b - dy) + 0.74 * (r - dy))).to_int()
      let q_val = (256.0 * (0.41 * (b - dy) + 0.48 * (r - dy))).to_int()
      yiq.set_y(col, row, y_val)
      yiq.set_i(col, row, i_val)
      yiq.set_q(col, row, q_val)
    }
  }
}

///|
/// Convert one field of planar int32 YIQ to interleaved RGBA.
/// Writes only the scanlines belonging to the specified field (0=even, 1=odd).
pub fn yiq2rgba(yiq : YiqFrame, field : Int, dst : FixedArray[Byte]) -> Unit {
  let width = yiq.width
  let height = yiq.height
  for row = field; row < height; row = row + 2 {
    let y_off = yiq.y_offset(row)
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    for col in 0..<width {
      let y_val = yiq.data[y_off + col]
      let i_val = yiq.data[i_off + col]
      let q_val = yiq.data[q_off + col]
      let r = ((
        1.000 * y_val.to_double() +
        0.956 * i_val.to_double() +
        0.621 * q_val.to_double()
      ) /
      256.0).to_int()
      let g = ((
        1.000 * y_val.to_double() +
        -0.272 * i_val.to_double() +
        -0.647 * q_val.to_double()
      ) /
      256.0).to_int()
      let b = ((
        1.000 * y_val.to_double() +
        -1.106 * i_val.to_double() +
        1.703 * q_val.to_double()
      ) /
      256.0).to_int()
      let idx = (row * width + col) * 4
      dst[idx] = r.clamp(min=0, max=255).to_byte()
      dst[idx + 1] = g.clamp(min=0, max=255).to_byte()
      dst[idx + 2] = b.clamp(min=0, max=255).to_byte()
      dst[idx + 3] = b'\xFF'
    }
  }
}
