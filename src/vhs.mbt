///|
/// VHS luma lowpass: 3-stage cascade + preemphasis.
pub fn vhs_luma_lowpass(yiq : YiqFrame, field : Int, luma_cut : Double) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let tmp1 = FixedArray::make(width, 0)
  let tmp2 = FixedArray::make(width, 0)
  let hp_buf = FixedArray::make(width, 0.0)
  for row = field; row < height; row = row + 2 {
    let y_off = yiq.y_offset(row)
    let (lp0, lp1, lp2) = lowpass_filters(luma_cut, reset=16.0)
    let pre = LowpassFilter::new(NTSC_RATE, luma_cut, value=16.0)
    // 3-stage cascade
    lp0.lowpass_array(yiq.data, y_off, tmp1, 0, width)
    lp1.lowpass_array(tmp1, 0, tmp2, 0, width)
    lp2.lowpass_array(tmp2, 0, tmp1, 0, width)
    // Preemphasis: f3 = f2 + highpass(f2) * 1.6
    pre.highpass_array(tmp1, 0, hp_buf, 0, width)
    for x in 0..<width {
      yiq.data[y_off + x] = (tmp1[x].to_double() + hp_buf[x] * 1.6).to_int()
    }
  }
}

///|
/// VHS chroma lowpass with delay compensation.
pub fn vhs_chroma_lowpass(
  yiq : YiqFrame,
  field : Int,
  chroma_cut : Double,
  chroma_delay : Int,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let tmp1 = FixedArray::make(width, 0)
  let tmp2 = FixedArray::make(width, 0)
  // Process I channel
  for row = field; row < height; row = row + 2 {
    let i_off = yiq.i_offset(row)
    let (lp0, lp1, lp2) = lowpass_filters(chroma_cut, reset=0.0)
    lp0.lowpass_array(yiq.data, i_off, tmp1, 0, width)
    lp1.lowpass_array(tmp1, 0, tmp2, 0, width)
    lp2.lowpass_array(tmp2, 0, tmp1, 0, width)
    for x in 0..<(width - chroma_delay) {
      yiq.data[i_off + x] = tmp1[x + chroma_delay]
    }
    for x in (width - chroma_delay)..<width {
      yiq.data[i_off + x] = 0
    }
  }
  // Process Q channel
  for row = field; row < height; row = row + 2 {
    let q_off = yiq.q_offset(row)
    let (lp0, lp1, lp2) = lowpass_filters(chroma_cut, reset=0.0)
    lp0.lowpass_array(yiq.data, q_off, tmp1, 0, width)
    lp1.lowpass_array(tmp1, 0, tmp2, 0, width)
    lp2.lowpass_array(tmp2, 0, tmp1, 0, width)
    for x in 0..<(width - chroma_delay) {
      yiq.data[q_off + x] = tmp1[x + chroma_delay]
    }
    for x in (width - chroma_delay)..<width {
      yiq.data[q_off + x] = 0
    }
  }
}

///|
/// VHS chroma vertical blend: average adjacent scanlines' chroma.
pub fn vhs_chroma_vert_blend(yiq : YiqFrame, field : Int) -> Unit {
  let width = yiq.width
  let height = yiq.height
  // Start from field+2 to have a previous line
  let mut prev_i_off = yiq.i_offset(field)
  let mut prev_q_off = yiq.q_offset(field)
  for row = field + 2; row < height; row = row + 2 {
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    for x in 0..<width {
      yiq.data[i_off + x] = (yiq.data[prev_i_off + x] + yiq.data[i_off + x] + 1) >>
        1
      yiq.data[q_off + x] = (yiq.data[prev_q_off + x] + yiq.data[q_off + x] + 1) >>
        1
    }
    prev_i_off = i_off
    prev_q_off = q_off
  }
}

///|
/// VHS sharpening: unsharp mask using lowpass.
pub fn vhs_sharpen(
  yiq : YiqFrame,
  field : Int,
  luma_cut : Double,
  sharpen : Double,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let tmp1 = FixedArray::make(width, 0)
  let tmp2 = FixedArray::make(width, 0)
  for row = field; row < height; row = row + 2 {
    let y_off = yiq.y_offset(row)
    let (lp0, lp1, lp2) = lowpass_filters(luma_cut * 4.0, reset=0.0)
    lp0.lowpass_array(yiq.data, y_off, tmp1, 0, width)
    lp1.lowpass_array(tmp1, 0, tmp2, 0, width)
    lp2.lowpass_array(tmp2, 0, tmp1, 0, width)
    for x in 0..<width {
      let s = yiq.data[y_off + x].to_double()
      let ts = tmp1[x].to_double()
      yiq.data[y_off + x] = (s + (s - ts) * sharpen * 2.0).to_int()
    }
  }
}

///|
/// VHS head switching noise artifact.
pub fn vhs_head_switching(
  yiq : YiqFrame,
  field : Int,
  config : NtscConfig,
  rng : XorWow,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let twidth = width + width / 10
  let mut noise = 0.0
  if config.vhs_head_switching_phase_noise != 0.0 {
    let x = (rng.rand() * rng.rand() * rng.rand() * rng.rand() % 2000000000).abs()
    noise = x.to_double() / 1000000000.0 - 1.0
    noise = noise * config.vhs_head_switching_phase_noise
  }
  let t = twidth.to_double() * (if config.output_ntsc { 262.5 } else { 312.5 })
  let p1 = (fmod(config.vhs_head_switching_point + noise, 1.0) * t).to_int()
  let mut y = p1 / twidth * 2 + field
  let p2 = (fmod(config.vhs_head_switching_phase + noise, 1.0) * t).to_int()
  let tx_init = p2 % twidth
  let y_offset = if config.output_ntsc {
    (262 - 240) * 2
  } else {
    (312 - 288) * 2
  }
  y = y - y_offset
  let ishif = if tx_init >= twidth / 2 { tx_init - twidth } else { tx_init }
  let mut shif = 0
  let mut shy = 0
  let mut tx = tx_init
  let tmp = FixedArray::make(twidth, 0)
  while y < height {
    if y >= 0 {
      let y_off = yiq.y_offset(y)
      if shif != 0 {
        // Copy Y row to tmp
        for x in 0..<width {
          tmp[x] = yiq.data[y_off + x]
        }
        for x in width..<twidth {
          tmp[x] = 0
        }
        let mut x2 = (tx + twidth + shif) % twidth
        for x in tx..<width {
          yiq.data[y_off + x] = tmp[x2]
          x2 = x2 + 1
          if x2 == twidth {
            x2 = 0
          }
        }
      }
    }
    shif = if shy == 0 { ishif } else { shif * 7 / 8 }
    tx = 0
    y = y + 2
    shy = shy + 1
  }
}

///|
/// VHS edge wave: random horizontal displacement of scanlines.
pub fn vhs_edge_wave(
  yiq : YiqFrame,
  field : Int,
  edge_wave : Int,
  luma_cut : Double,
  rng : XorWow,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let field_height = (height - field + 1) / 2
  // Generate random shifts
  let rnds = FixedArray::make(field_height, 0.0)
  for i in 0..<field_height {
    rnds[i] = rng.next_int(from=0, until=edge_wave).to_double()
  }
  // Smooth with lowpass
  let lp = LowpassFilter::new(NTSC_RATE, luma_cut)
  let smoothed = FixedArray::make(field_height, 0.0)
  lp.lowpass_doubles(rnds, smoothed, field_height)
  // Apply shifts to all 3 planes
  let mut idx = 0
  for row = field; row < height; row = row + 2 {
    let shift_val = smoothed[idx].to_int()
    idx = idx + 1
    if shift_val <= 0 {
      continue
    }
    // Shift right by shift_val (pad left with zeros)
    let y_off = yiq.y_offset(row)
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    // Shift right: move pixels from [0..width-shift] to [shift..width]
    for x = width - 1; x >= shift_val; x = x - 1 {
      yiq.data[y_off + x] = yiq.data[y_off + x - shift_val]
      yiq.data[i_off + x] = yiq.data[i_off + x - shift_val]
      yiq.data[q_off + x] = yiq.data[q_off + x - shift_val]
    }
    for x in 0..<shift_val {
      yiq.data[y_off + x] = 0
      yiq.data[i_off + x] = 0
      yiq.data[q_off + x] = 0
    }
  }
}

///|
/// VHS chroma loss: randomly drop chroma from entire scanlines.
pub fn vhs_chroma_loss(
  yiq : YiqFrame,
  field : Int,
  chroma_loss : Int,
  rng : XorWow,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  for row = field; row < height; row = row + 2 {
    if rng.rand() % 100000 < chroma_loss {
      let i_off = yiq.i_offset(row)
      let q_off = yiq.q_offset(row)
      for x in 0..<width {
        yiq.data[i_off + x] = 0
        yiq.data[q_off + x] = 0
      }
    }
  }
}

///|
/// VHS emulation: apply all VHS effects in order.
pub fn emulate_vhs(
  yiq : YiqFrame,
  field : Int,
  fieldno : Int,
  config : NtscConfig,
  rng : XorWow,
) -> Unit {
  let speed = config.output_vhs_tape_speed
  if config.vhs_edge_wave != 0 {
    vhs_edge_wave(yiq, field, config.vhs_edge_wave, speed.luma_cut(), rng)
  }
  vhs_luma_lowpass(yiq, field, speed.luma_cut())
  vhs_chroma_lowpass(yiq, field, speed.chroma_cut(), speed.chroma_delay())
  if config.vhs_chroma_vert_blend && config.output_ntsc {
    vhs_chroma_vert_blend(yiq, field)
  }
  vhs_sharpen(yiq, field, speed.luma_cut(), config.vhs_out_sharpen)
  if not(config.vhs_svideo_out) {
    chroma_into_luma(
      yiq,
      field,
      fieldno,
      config.subcarrier_amplitude,
      config.video_scanline_phase_shift,
      config.video_scanline_phase_shift_offset,
    )
    chroma_from_luma(
      yiq,
      field,
      fieldno,
      config.subcarrier_amplitude,
      config.video_scanline_phase_shift,
      config.video_scanline_phase_shift_offset,
    )
  }
}

///|
fn fmod(x : Double, y : Double) -> Double {
  x - (x / y).floor() * y
}
