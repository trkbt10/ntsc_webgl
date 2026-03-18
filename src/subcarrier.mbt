///|
/// Subcarrier modulation patterns (sampled at 4x subcarrier frequency).
let umult : FixedArray[Int] = [1, 0, -1, 0]

///|
let vmult : FixedArray[Int] = [0, 1, 0, -1]

///|
/// Compute chroma-luma phase index for a given scanline.
fn chroma_luma_xi(
  phase_shift : Int,
  phase_offset : Int,
  fieldno : Int,
  row : Int,
) -> Int {
  if phase_shift == 90 {
    (fieldno + phase_offset + (row >> 1)) & 3
  } else if phase_shift == 180 {
    (((fieldno + row) & 2) + phase_offset) & 3
  } else if phase_shift == 270 {
    (fieldno + phase_offset) & 3
  } else {
    phase_offset & 3
  }
}

///|
/// Encode: modulate I/Q chroma onto luma (composite encoding).
/// After this, I and Q are zeroed; chroma info is in Y.
pub fn chroma_into_luma(
  yiq : YiqFrame,
  field : Int,
  fieldno : Int,
  subcarrier_amplitude : Int,
  phase_shift : Int,
  phase_offset : Int,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let hw = height * width
  for row = field; row < height; row = row + 2 {
    let row_off = row * width
    let y_off = row_off
    let i_off = hw + row_off
    let q_off = hw + hw + row_off
    let xi = chroma_luma_xi(phase_shift, phase_offset, fieldno, row)
    // Pre-compute the 4-element pattern for this row
    let u0 = umult[xi & 3] * subcarrier_amplitude
    let v0 = vmult[xi & 3] * subcarrier_amplitude
    let u1 = umult[(xi + 1) & 3] * subcarrier_amplitude
    let v1 = vmult[(xi + 1) & 3] * subcarrier_amplitude
    let u2 = umult[(xi + 2) & 3] * subcarrier_amplitude
    let v2 = vmult[(xi + 2) & 3] * subcarrier_amplitude
    let u3 = umult[(xi + 3) & 3] * subcarrier_amplitude
    let v3 = vmult[(xi + 3) & 3] * subcarrier_amplitude
    let us = [u0, u1, u2, u3]
    let vs = [v0, v1, v2, v3]
    for x in 0..<width {
      let phase = x & 3
      let i_val = data[i_off + x]
      let q_val = data[q_off + x]
      let chroma = (i_val * us[phase] + q_val * vs[phase]) / 50
      data[y_off + x] = data[y_off + x] + chroma
      data[i_off + x] = 0
      data[q_off + x] = 0
    }
  }
}

///|
/// Decode: extract chroma from composite luma signal.
/// Faithful port of Python chroma_from_luma.
pub fn chroma_from_luma(
  yiq : YiqFrame,
  field : Int,
  fieldno : Int,
  subcarrier_amplitude : Int,
  phase_shift : Int,
  phase_offset : Int,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let hw = height * width
  // Allocate chroma buffer once outside row loop
  let chroma = FixedArray::make(width, 0)
  for row = field; row < height; row = row + 2 {
    let row_off = row * width
    let y_off = row_off
    let i_off = hw + row_off
    let q_off = hw + hw + row_off
    // Running sum to reconstruct smoothed luma
    let mut sum = data[y_off] + data[y_off + 1]
    // First pass: compute running sum and extract chroma
    for x in 0..<width {
      let y2 = if x + 2 < width { data[y_off + x + 2] } else { 0 }
      let yd4 = if x >= 2 { data[y_off + x - 2] } else { 0 }
      if x > 0 {
        sum = sum + (y2 - yd4)
      }
      let acc4 = sum / 4
      chroma[x] = y2 - acc4
      data[y_off + x] = acc4
    }
    // Flip negative phases of subcarrier
    let xi = chroma_luma_xi(phase_shift, phase_offset, fieldno, row)
    let x_start = (4 - xi) & 3
    for x = x_start + 2; x < width; x = x + 4 {
      chroma[x] = -chroma[x]
    }
    for x = x_start + 3; x < width; x = x + 4 {
      chroma[x] = -chroma[x]
    }
    // Scale chroma back and negate (combined with the -chroma[x] used later)
    let scale_num = 50
    let scale_den = subcarrier_amplitude
    for x in 0..<width {
      chroma[x] = chroma[x] * scale_num / scale_den
    }
    // Zero out I and Q
    for x in 0..<width {
      data[i_off + x] = 0
      data[q_off + x] = 0
    }
    // Sample at even positions
    let mut dst_idx = 0
    for x = xi; x < width; x = x + 2 {
      let even_dst = dst_idx * 2
      if even_dst < width {
        data[i_off + even_dst] = -chroma[x]
      }
      dst_idx = dst_idx + 1
    }
    dst_idx = 0
    for x = xi + 1; x < width; x = x + 2 {
      let even_dst = dst_idx * 2
      if even_dst < width {
        data[q_off + even_dst] = -chroma[x]
      }
      dst_idx = dst_idx + 1
    }
    // Interpolate odd-indexed samples
    for x = 1; x < width - 2; x = x + 2 {
      data[i_off + x] = (data[i_off + x - 1] + data[i_off + x + 1]) >> 1
      data[q_off + x] = (data[q_off + x - 1] + data[q_off + x + 1]) >> 1
    }
    // Zero tail
    if width >= 2 {
      data[i_off + width - 2] = 0
      data[i_off + width - 1] = 0
      data[q_off + width - 2] = 0
      data[q_off + width - 1] = 0
    }
  }
}
