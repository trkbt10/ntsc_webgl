///|
/// Main NTSC processor that orchestrates the full pipeline.
pub(all) struct NtscProcessor {
  config : NtscConfig
  rng : XorWow
  mut field_number : Int
  // Pre-allocated buffers
  mut yiq : YiqFrame
  mut width : Int
  mut height : Int
  // Resolution scaling
  mut effective_rate : Double
  mut rate_scale : Double
}

///|
pub fn NtscProcessor::new(config : NtscConfig) -> NtscProcessor {
  {
    config,
    rng: XorWow::new(31374242, 0),
    field_number: 0,
    yiq: YiqFrame::new(0, 0),
    width: 0,
    height: 0,
    effective_rate: NTSC_RATE,
    rate_scale: 1.0,
  }
}

///|
/// Initialize or re-initialize for a given frame size.
fn NtscProcessor::ensure_buffers(
  self : NtscProcessor,
  width : Int,
  height : Int,
) -> Unit {
  if self.width != width || self.height != height {
    self.width = width
    self.height = height
    self.yiq = YiqFrame::new(width, height)
    self.rate_scale = width.to_double() / NTSC_REFERENCE_WIDTH.to_double()
    self.effective_rate = NTSC_RATE * self.rate_scale
  }
}

///|
/// Scale a pixel-count parameter by the resolution ratio.
fn scale_px(value : Int, rate_scale : Double) -> Int {
  (value.to_double() * rate_scale).to_int()
}

///|
/// Process one frame: RGBA in -> RGBA out.
/// Alternates between even/odd fields for interlaced output.
pub fn NtscProcessor::process_frame(
  self : NtscProcessor,
  rgba_in : FixedArray[Byte],
  width : Int,
  height : Int,
  rgba_out : FixedArray[Byte],
) -> Unit {
  self.ensure_buffers(width, height)
  let field = self.field_number % 2
  let fieldno = self.field_number
  let yiq = self.yiq
  let config = self.config
  let rate = self.effective_rate
  let rs = self.rate_scale
  // 1. Convert RGBA to YIQ
  rgba2yiq(rgba_in, width, height, yiq)
  // 2. Color bleed (before)
  if config.color_bleed_before &&
    (config.color_bleed_vert != 0 || config.color_bleed_horiz != 0) {
    color_bleed(
      yiq,
      field,
      scale_px(config.color_bleed_horiz, rs),
      scale_px(config.color_bleed_vert, rs),
    )
  }
  // 3. Input chroma lowpass
  if config.composite_in_chroma_lowpass {
    composite_lowpass(yiq, field, fieldno, rate~)
  }
  // 4. Encode: chroma into luma
  chroma_into_luma(
    yiq,
    field,
    fieldno,
    config.subcarrier_amplitude,
    config.video_scanline_phase_shift,
    config.video_scanline_phase_shift_offset,
  )
  // 5. Composite preemphasis
  if config.composite_preemphasis != 0.0 &&
    config.composite_preemphasis_cut > 0.0 {
    composite_preemphasis(
      yiq,
      field,
      config.composite_preemphasis,
      config.composite_preemphasis_cut,
      rate~,
    )
  }
  // 6. Video noise
  if config.video_noise != 0 {
    video_noise(yiq, field, config.video_noise, self.rng)
  }
  // 7. VHS head switching
  if config.vhs_head_switching {
    vhs_head_switching(yiq, field, config, self.rng)
  }
  // 8. Decode: chroma from luma
  if not(config.nocolor_subcarrier) {
    chroma_from_luma(
      yiq,
      field,
      fieldno,
      config.subcarrier_amplitude_back,
      config.video_scanline_phase_shift,
      config.video_scanline_phase_shift_offset,
    )
  }
  // 9. Chroma noise
  if config.video_chroma_noise != 0 {
    video_chroma_noise(yiq, field, config.video_chroma_noise, self.rng)
  }
  // 10. Chroma phase noise
  if config.video_chroma_phase_noise != 0 {
    video_chroma_phase_noise(
      yiq,
      field,
      config.video_chroma_phase_noise,
      self.rng,
    )
  }
  // 11. VHS emulation
  if config.emulating_vhs {
    emulate_vhs(yiq, field, fieldno, config, self.rng, rate~, rate_scale=rs)
  }
  // 12. Chroma loss
  if config.video_chroma_loss != 0 {
    vhs_chroma_loss(yiq, field, config.video_chroma_loss, self.rng)
  }
  // 13. Output chroma lowpass
  if config.composite_out_chroma_lowpass {
    if config.composite_out_chroma_lowpass_lite {
      composite_lowpass_tv(yiq, field, fieldno, rate~)
    } else {
      composite_lowpass(yiq, field, fieldno, rate~)
    }
  }
  // 14. Color bleed (after)
  if not(config.color_bleed_before) &&
    (config.color_bleed_vert != 0 || config.color_bleed_horiz != 0) {
    color_bleed(
      yiq,
      field,
      scale_px(config.color_bleed_horiz, rs),
      scale_px(config.color_bleed_vert, rs),
    )
  }
  // 15. Blur chroma (simulate reduced chroma bandwidth)
  let chroma_step = if rs > 1.0 {
    (2.0 * rs).to_int()
  } else {
    2
  }
  blur_chroma(yiq, field, chroma_step~)
  // 16. Convert YIQ back to RGBA
  yiq2rgba(yiq, field, rgba_out)
  // Advance field
  self.field_number = self.field_number + 1
}

///|
/// Chroma blur with configurable step size.
/// At reference width (320), step=2. At higher resolutions, step scales proportionally.
fn blur_chroma(
  yiq : YiqFrame,
  field : Int,
  chroma_step~ : Int = 2,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let data = yiq.data
  let hw = height * width
  let step = chroma_step
  for row = field; row < height; row = row + 2 {
    let row_off = row * width
    let i_off = hw + row_off
    let q_off = hw + hw + row_off
    for x = 0; x < width - step + 1; x = x + step {
      let mut sum_i = 0
      let mut sum_q = 0
      for k in 0..<step {
        sum_i = sum_i + data[i_off + x + k]
        sum_q = sum_q + data[q_off + x + k]
      }
      let avg_i = sum_i / step
      let avg_q = sum_q / step
      for k in 0..<step {
        data[i_off + x + k] = avg_i
        data[q_off + x + k] = avg_q
      }
    }
  }
}
