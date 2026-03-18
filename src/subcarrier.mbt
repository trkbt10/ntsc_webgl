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
  for row = field; row < height; row = row + 2 {
    let y_off = yiq.y_offset(row)
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    let xi = chroma_luma_xi(phase_shift, phase_offset, fieldno, row)
    for x in 0..<width {
      let u = umult[(xi + x) & 3]
      let v = vmult[(xi + x) & 3]
      let i_val = yiq.data[i_off + x]
      let q_val = yiq.data[q_off + x]
      let chroma = (
          i_val * subcarrier_amplitude * u + q_val * subcarrier_amplitude * v
        ) /
        50
      yiq.data[y_off + x] = yiq.data[y_off + x] + chroma
      yiq.data[i_off + x] = 0
      yiq.data[q_off + x] = 0
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
  for row = field; row < height; row = row + 2 {
    let y_off = yiq.y_offset(row)
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    // Running sum to reconstruct smoothed luma
    let mut sum = yiq.data[y_off] + yiq.data[y_off + 1]
    // Build accumulated average (acc4 = running_sum / 4)
    // and extract chroma oscillation (chroma = Y[x+2] - acc4)
    // We compute this iteratively to match the Python vectorized version.
    let chroma = FixedArray::make(width, 0)
    // First pass: compute running sum and extract chroma
    for x in 0..<width {
      // y2[x] = Y[x+2] (with zero padding at end)
      let y2 = if x + 2 < width { yiq.data[y_off + x + 2] } else { 0 }
      // yd4[x] = Y[x-2] (with zero padding at start)
      let yd4 = if x >= 2 { yiq.data[y_off + x - 2] } else { 0 }
      if x > 0 {
        sum = sum + (y2 - yd4)
      }
      let acc4 = sum / 4
      chroma[x] = y2 - acc4
      yiq.data[y_off + x] = acc4
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
    // Scale chroma back
    for x in 0..<width {
      chroma[x] = chroma[x] * 50 / subcarrier_amplitude
    }
    // Decode I and Q from chroma at xi-offset positions
    // I comes from chroma[xi::2], Q from chroma[xi+1::2]
    // First zero out I and Q
    for x in 0..<width {
      yiq.data[i_off + x] = 0
      yiq.data[q_off + x] = 0
    }
    // Sample at even positions
    let mut dst_idx = 0
    for x = xi; x < width; x = x + 2 {
      let even_dst = dst_idx * 2
      if even_dst < width {
        yiq.data[i_off + even_dst] = -chroma[x]
      }
      dst_idx = dst_idx + 1
    }
    dst_idx = 0
    for x = xi + 1; x < width; x = x + 2 {
      let even_dst = dst_idx * 2
      if even_dst < width {
        yiq.data[q_off + even_dst] = -chroma[x]
      }
      dst_idx = dst_idx + 1
    }
    // Interpolate odd-indexed samples
    for x = 1; x < width - 2; x = x + 2 {
      yiq.data[i_off + x] = (yiq.data[i_off + x - 1] + yiq.data[i_off + x + 1]) >>
        1
      yiq.data[q_off + x] = (yiq.data[q_off + x - 1] + yiq.data[q_off + x + 1]) >>
        1
    }
    // Zero tail
    if width >= 2 {
      yiq.data[i_off + width - 2] = 0
      yiq.data[i_off + width - 1] = 0
      yiq.data[q_off + width - 2] = 0
      yiq.data[q_off + width - 1] = 0
    }
  }
}
