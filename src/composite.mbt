///|
/// Apply chroma lowpass filter (NTSC spec: I=1.3MHz, Q=600kHz).
/// 3-stage cascade with delay compensation.
pub fn composite_lowpass(
  yiq : YiqFrame,
  field : Int,
  _fieldno : Int,
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let tmp = FixedArray::make(width, 0)
  let alpha_i = lowpass_alpha(rate, 1300000.0)
  let alpha_q = lowpass_alpha(rate, 600000.0)
  let hw = height * width
  // Delay compensation scales with rate
  let delay_i = (2.0 * rate / NTSC_RATE).to_int()
  let delay_q = (4.0 * rate / NTSC_RATE).to_int()
  // Process I channel (cutoff=1.3MHz)
  for row = field; row < height; row = row + 2 {
    let off = hw + row * width
    lowpass_cascade3(data, off, tmp, 0, width, alpha_i)
    let shift_i = if delay_i < width { delay_i } else { width - 1 }
    FixedArray::unsafe_blit(data, off, tmp, shift_i, width - shift_i)
    for x in (width - shift_i)..<width {
      data[off + x] = 0
    }
  }
  // Process Q channel (cutoff=600kHz)
  for row = field; row < height; row = row + 2 {
    let off = hw + hw + row * width
    lowpass_cascade3(data, off, tmp, 0, width, alpha_q)
    let shift_q = if delay_q < width { delay_q } else { width - 1 }
    FixedArray::unsafe_blit(data, off, tmp, shift_q, width - shift_q)
    for x in (width - shift_q)..<width {
      data[off + x] = 0
    }
  }
}

///|
/// Lighter-weight chroma lowpass (TV quality, 2.6MHz cutoff).
pub fn composite_lowpass_tv(
  yiq : YiqFrame,
  field : Int,
  _fieldno : Int,
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let tmp = FixedArray::make(width, 0)
  let alpha = lowpass_alpha(rate, 2600000.0)
  let hw = height * width
  let delay = (1.0 * rate / NTSC_RATE).to_int()
  let shift = if delay < width { delay } else { width - 1 }
  // Process I channel
  for row = field; row < height; row = row + 2 {
    let off = hw + row * width
    lowpass_cascade3(data, off, tmp, 0, width, alpha)
    FixedArray::unsafe_blit(data, off, tmp, shift, width - shift)
    for x in (width - shift)..<width {
      data[off + x] = 0
    }
  }
  // Process Q channel
  for row = field; row < height; row = row + 2 {
    let off = hw + hw + row * width
    lowpass_cascade3(data, off, tmp, 0, width, alpha)
    FixedArray::unsafe_blit(data, off, tmp, shift, width - shift)
    for x in (width - shift)..<width {
      data[off + x] = 0
    }
  }
}

///|
/// Apply composite preemphasis (high-frequency boost on luma).
pub fn composite_preemphasis(
  yiq : YiqFrame,
  field : Int,
  preemphasis : Double,
  preemphasis_cut : Double,
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let hp_buf = FixedArray::make(width, 0.0)
  for row = field; row < height; row = row + 2 {
    let off = yiq.y_offset(row)
    let pre = LowpassFilter::new(rate, preemphasis_cut, value=16.0)
    pre.highpass_array(yiq.data, off, hp_buf, 0, width)
    for x in 0..<width {
      yiq.data[off + x] = (yiq.data[off + x].to_double() +
      hp_buf[x] * preemphasis).to_int()
    }
  }
}
