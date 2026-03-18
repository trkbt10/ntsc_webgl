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
  }
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
  // 1. Convert RGBA to YIQ
  rgba2yiq(rgba_in, width, height, yiq)
  // 2. Color bleed (before)
  if config.color_bleed_before &&
    (config.color_bleed_vert != 0 || config.color_bleed_horiz != 0) {
    color_bleed(yiq, field, config.color_bleed_horiz, config.color_bleed_vert)
  }
  // 3. Input chroma lowpass
  if config.composite_in_chroma_lowpass {
    composite_lowpass(yiq, field, fieldno)
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
    emulate_vhs(yiq, field, fieldno, config, self.rng)
  }
  // 12. Chroma loss
  if config.video_chroma_loss != 0 {
    vhs_chroma_loss(yiq, field, config.video_chroma_loss, self.rng)
  }
  // 13. Output chroma lowpass
  if config.composite_out_chroma_lowpass {
    if config.composite_out_chroma_lowpass_lite {
      composite_lowpass_tv(yiq, field, fieldno)
    } else {
      composite_lowpass(yiq, field, fieldno)
    }
  }
  // 14. Color bleed (after)
  if not(config.color_bleed_before) &&
    (config.color_bleed_vert != 0 || config.color_bleed_horiz != 0) {
    color_bleed(yiq, field, config.color_bleed_horiz, config.color_bleed_vert)
  }
  // 15. Blur chroma (simulate reduced chroma bandwidth)
  blur_chroma(yiq, field)
  // 16. Convert YIQ back to RGBA
  yiq2rgba(yiq, field, rgba_out)
  // Advance field
  self.field_number = self.field_number + 1
}

///|
/// Simple 2x chroma blur (downsample + upsample by averaging).
/// Simulates YUV 4:2:0 subsampling.
fn blur_chroma(yiq : YiqFrame, field : Int) -> Unit {
  let width = yiq.width
  let height = yiq.height
  // Simple horizontal 2x blur for I and Q
  for row = field; row < height; row = row + 2 {
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    // Horizontal downsample by averaging pairs, then spread back
    for x = 0; x < width - 1; x = x + 2 {
      let avg_i = (yiq.data[i_off + x] + yiq.data[i_off + x + 1]) / 2
      let avg_q = (yiq.data[q_off + x] + yiq.data[q_off + x + 1]) / 2
      yiq.data[i_off + x] = avg_i
      yiq.data[i_off + x + 1] = avg_i
      yiq.data[q_off + x] = avg_q
      yiq.data[q_off + x + 1] = avg_q
    }
  }
}
