///|
/// Apply chroma lowpass filter (NTSC spec: I=1.3MHz, Q=600kHz).
/// 3-stage cascade with delay compensation.
pub fn composite_lowpass(yiq : YiqFrame, field : Int, _fieldno : Int) -> Unit {
  let width = yiq.width
  let height = yiq.height
  // Temp buffer for cascade filtering
  let tmp = FixedArray::make(width, 0)
  // Process I channel (p=1: cutoff=1.3MHz, delay=2) and Q channel (p=2: cutoff=600kHz, delay=4)
  for p in 1..<=2 {
    let cutoff = if p == 1 { 1300000.0 } else { 600000.0 }
    let delay = if p == 1 { 2 } else { 4 }
    let plane_off = if p == 1 { height * width } else { 2 * height * width }
    for row = field; row < height; row = row + 2 {
      let off = plane_off + row * width
      let (lp0, lp1, lp2) = lowpass_filters(cutoff, reset=0.0)
      // 3-stage cascade: src -> tmp -> src -> tmp
      lp0.lowpass_array(yiq.data, off, tmp, 0, width)
      lp1.lowpass_array(tmp, 0, yiq.data, off, width)
      lp2.lowpass_array(yiq.data, off, tmp, 0, width)
      // Apply delay compensation: shift left by 'delay' samples
      for x in 0..<(width - delay) {
        yiq.data[off + x] = tmp[x + delay]
      }
      // Zero the tail
      for x in (width - delay)..<width {
        yiq.data[off + x] = 0
      }
    }
  }
}

///|
/// Lighter-weight chroma lowpass (TV quality, 2.6MHz cutoff).
pub fn composite_lowpass_tv(
  yiq : YiqFrame,
  field : Int,
  _fieldno : Int,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let tmp = FixedArray::make(width, 0)
  let delay = 1
  for p in 1..<=2 {
    let plane_off = if p == 1 { height * width } else { 2 * height * width }
    for row = field; row < height; row = row + 2 {
      let off = plane_off + row * width
      let (lp0, lp1, lp2) = lowpass_filters(2600000.0, reset=0.0)
      lp0.lowpass_array(yiq.data, off, tmp, 0, width)
      lp1.lowpass_array(tmp, 0, yiq.data, off, width)
      lp2.lowpass_array(yiq.data, off, tmp, 0, width)
      for x in 0..<(width - delay) {
        yiq.data[off + x] = tmp[x + delay]
      }
      for x in (width - delay)..<width {
        yiq.data[off + x] = 0
      }
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
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let hp_buf = FixedArray::make(width, 0.0)
  for row = field; row < height; row = row + 2 {
    let off = yiq.y_offset(row)
    let pre = LowpassFilter::new(NTSC_RATE, preemphasis_cut, value=16.0)
    pre.highpass_array(yiq.data, off, hp_buf, 0, width)
    for x in 0..<width {
      yiq.data[off + x] = (yiq.data[off + x].to_double() +
      hp_buf[x] * preemphasis).to_int()
    }
  }
}
