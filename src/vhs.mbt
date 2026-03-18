///|
/// VHS luma lowpass: 3-stage cascade + preemphasis.
pub fn vhs_luma_lowpass(
  yiq : YiqFrame,
  field : Int,
  luma_cut : Double,
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let tmp = FixedArray::make(width, 0)
  let hp_buf = FixedArray::make(width, 0.0)
  let alpha = lowpass_alpha(rate, luma_cut)
  for row = field; row < height; row = row + 2 {
    let y_off = row * width
    lowpass_cascade3(data, y_off, tmp, 0, width, alpha)
    for x in 0..<width {
      data[y_off + x] = tmp[x]
    }
    let pre = LowpassFilter::new(rate, luma_cut, value=16.0)
    pre.highpass_array(tmp, 0, hp_buf, 0, width)
    for x in 0..<width {
      data[y_off + x] = (tmp[x].to_double() + hp_buf[x] * 1.6).to_int()
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
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let hw = height * width
  let tmp = FixedArray::make(width, 0)
  let alpha = lowpass_alpha(rate, chroma_cut)
  // Process I channel
  for row = field; row < height; row = row + 2 {
    let i_off = hw + row * width
    lowpass_cascade3(data, i_off, tmp, 0, width, alpha)
    let d = if chroma_delay < width { chroma_delay } else { width - 1 }
    for x in 0..<(width - d) {
      data[i_off + x] = tmp[x + d]
    }
    for x in (width - d)..<width {
      data[i_off + x] = 0
    }
  }
  // Process Q channel
  for row = field; row < height; row = row + 2 {
    let q_off = hw + hw + row * width
    lowpass_cascade3(data, q_off, tmp, 0, width, alpha)
    let d = if chroma_delay < width { chroma_delay } else { width - 1 }
    for x in 0..<(width - d) {
      data[q_off + x] = tmp[x + d]
    }
    for x in (width - d)..<width {
      data[q_off + x] = 0
    }
  }
}

///|
/// VHS chroma vertical blend: average adjacent scanlines' chroma.
pub fn vhs_chroma_vert_blend(yiq : YiqFrame, field : Int) -> Unit {
  let width = yiq.width
  let height = yiq.height
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
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let tmp = FixedArray::make(width, 0)
  let alpha = lowpass_alpha(rate, luma_cut * 4.0)
  let sharpen2 = sharpen * 2.0
  for row = field; row < height; row = row + 2 {
    let y_off = row * width
    lowpass_cascade3(data, y_off, tmp, 0, width, alpha)
    for x in 0..<width {
      let s = data[y_off + x].to_double()
      let ts = tmp[x].to_double()
      data[y_off + x] = (s + (s - ts) * sharpen2).to_int()
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
  let total_lines = if config.output_ntsc { 262.5 } else { 312.5 }
  let t = twidth.to_double() * total_lines
  let p1 = (fmod(config.vhs_head_switching_point + noise, 1.0) * t).to_int()
  let mut y = p1 / twidth * 2 + field
  let p2 = (fmod(config.vhs_head_switching_phase + noise, 1.0) * t).to_int()
  let tx_init = p2 % twidth
  let visible_lines = height / 2
  let total_lines_int = total_lines.to_int()
  let y_offset = if total_lines_int > visible_lines {
    (total_lines_int - visible_lines) * 2
  } else {
    0
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
  rate~ : Double = NTSC_RATE,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let field_height = (height - field + 1) / 2
  let rnds = FixedArray::make(field_height, 0.0)
  for i in 0..<field_height {
    rnds[i] = rng.next_int(from=0, until=edge_wave).to_double()
  }
  let lp = LowpassFilter::new(rate, luma_cut)
  let smoothed = FixedArray::make(field_height, 0.0)
  lp.lowpass_doubles(rnds, smoothed, field_height)
  let mut idx = 0
  for row = field; row < height; row = row + 2 {
    let shift_val = smoothed[idx].to_int()
    idx = idx + 1
    if shift_val <= 0 {
      continue
    }
    let y_off = yiq.y_offset(row)
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
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
  rate~ : Double = NTSC_RATE,
  rate_scale~ : Double = 1.0,
) -> Unit {
  let speed = config.output_vhs_tape_speed
  if config.vhs_edge_wave != 0 {
    let scaled_wave = scale_px(config.vhs_edge_wave, rate_scale)
    vhs_edge_wave(yiq, field, scaled_wave, speed.luma_cut(), rng, rate~)
  }
  vhs_luma_lowpass(yiq, field, speed.luma_cut(), rate~)
  let scaled_delay = scale_px(speed.chroma_delay(), rate_scale)
  vhs_chroma_lowpass(yiq, field, speed.chroma_cut(), scaled_delay, rate~)
  if config.vhs_chroma_vert_blend && config.output_ntsc {
    vhs_chroma_vert_blend(yiq, field)
  }
  vhs_sharpen(yiq, field, speed.luma_cut(), config.vhs_out_sharpen, rate~)
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
