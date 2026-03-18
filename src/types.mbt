///|
/// NTSC rate: 315/88 MHz * 4 ≈ 14.318 MHz
pub const NTSC_RATE : Double = 315000000.0 / 88.0 * 4.0

///|
pub(all) enum VHSSpeed {
  SP
  LP
  EP
}

///|
pub fn VHSSpeed::luma_cut(self : VHSSpeed) -> Double {
  match self {
    SP => 2400000.0
    LP => 1900000.0
    EP => 1400000.0
  }
}

///|
pub fn VHSSpeed::chroma_cut(self : VHSSpeed) -> Double {
  match self {
    SP => 320000.0
    LP => 300000.0
    EP => 280000.0
  }
}

///|
pub fn VHSSpeed::chroma_delay(self : VHSSpeed) -> Int {
  match self {
    SP => 9
    LP => 12
    EP => 14
  }
}

///|
/// Planar int32 CHW YIQ frame buffer.
/// Y at offset 0, I at offset h*w, Q at offset 2*h*w.
/// Values are scaled by 256 for fixed-point arithmetic.
pub(all) struct YiqFrame {
  data : FixedArray[Int]
  width : Int
  height : Int
}

///|
pub fn YiqFrame::new(width : Int, height : Int) -> YiqFrame {
  { data: FixedArray::make(3 * height * width, 0), width, height }
}

///|
/// Get Y value at (x, y)
pub fn YiqFrame::y(self : YiqFrame, x : Int, y : Int) -> Int {
  self.data[y * self.width + x]
}

///|
/// Get I value at (x, y)
pub fn YiqFrame::i(self : YiqFrame, x : Int, y : Int) -> Int {
  self.data[self.height * self.width + y * self.width + x]
}

///|
/// Get Q value at (x, y)
pub fn YiqFrame::q(self : YiqFrame, x : Int, y : Int) -> Int {
  self.data[2 * self.height * self.width + y * self.width + x]
}

///|
/// Set Y value at (x, y)
pub fn YiqFrame::set_y(self : YiqFrame, x : Int, y : Int, v : Int) -> Unit {
  self.data[y * self.width + x] = v
}

///|
/// Set I value at (x, y)
pub fn YiqFrame::set_i(self : YiqFrame, x : Int, y : Int, v : Int) -> Unit {
  self.data[self.height * self.width + y * self.width + x] = v
}

///|
/// Set Q value at (x, y)
pub fn YiqFrame::set_q(self : YiqFrame, x : Int, y : Int, v : Int) -> Unit {
  self.data[2 * self.height * self.width + y * self.width + x] = v
}

///|
/// Offset into data array for Y plane row
fn YiqFrame::y_offset(self : YiqFrame, row : Int) -> Int {
  row * self.width
}

///|
/// Offset into data array for I plane row
fn YiqFrame::i_offset(self : YiqFrame, row : Int) -> Int {
  self.height * self.width + row * self.width
}

///|
/// Offset into data array for Q plane row
fn YiqFrame::q_offset(self : YiqFrame, row : Int) -> Int {
  2 * self.height * self.width + row * self.width
}

///|
pub(all) struct NtscConfig {
  mut composite_preemphasis : Double
  mut composite_preemphasis_cut : Double
  mut vhs_out_sharpen : Double
  mut vhs_edge_wave : Int
  mut vhs_head_switching : Bool
  mut vhs_head_switching_point : Double
  mut vhs_head_switching_phase : Double
  mut vhs_head_switching_phase_noise : Double
  mut color_bleed_before : Bool
  mut color_bleed_horiz : Int
  mut color_bleed_vert : Int
  mut ringing : Double
  mut enable_ringing2 : Bool
  mut ringing_power : Int
  mut ringing_shift : Int
  mut freq_noise_size : Double
  mut freq_noise_amplitude : Double
  mut composite_in_chroma_lowpass : Bool
  mut composite_out_chroma_lowpass : Bool
  mut composite_out_chroma_lowpass_lite : Bool
  mut video_chroma_noise : Int
  mut video_chroma_phase_noise : Int
  mut video_chroma_loss : Int
  mut video_noise : Int
  mut subcarrier_amplitude : Int
  mut subcarrier_amplitude_back : Int
  mut emulating_vhs : Bool
  mut nocolor_subcarrier : Bool
  mut vhs_chroma_vert_blend : Bool
  mut vhs_svideo_out : Bool
  mut output_ntsc : Bool
  mut video_scanline_phase_shift : Int
  mut video_scanline_phase_shift_offset : Int
  mut output_vhs_tape_speed : VHSSpeed
}

///|
pub fn NtscConfig::new() -> NtscConfig {
  {
    composite_preemphasis: 0.0,
    composite_preemphasis_cut: 1000000.0,
    vhs_out_sharpen: 1.5,
    vhs_edge_wave: 0,
    vhs_head_switching: false,
    vhs_head_switching_point: 1.0 - (4.5 + 0.01) / 262.5,
    vhs_head_switching_phase: (1.0 - 0.01) / 262.5,
    vhs_head_switching_phase_noise: 1.0 / 500.0 / 262.5,
    color_bleed_before: true,
    color_bleed_horiz: 0,
    color_bleed_vert: 0,
    ringing: 1.0,
    enable_ringing2: false,
    ringing_power: 2,
    ringing_shift: 0,
    freq_noise_size: 0.0,
    freq_noise_amplitude: 2.0,
    composite_in_chroma_lowpass: true,
    composite_out_chroma_lowpass: true,
    composite_out_chroma_lowpass_lite: true,
    video_chroma_noise: 0,
    video_chroma_phase_noise: 0,
    video_chroma_loss: 0,
    video_noise: 2,
    subcarrier_amplitude: 50,
    subcarrier_amplitude_back: 50,
    emulating_vhs: false,
    nocolor_subcarrier: false,
    vhs_chroma_vert_blend: true,
    vhs_svideo_out: false,
    output_ntsc: true,
    video_scanline_phase_shift: 180,
    video_scanline_phase_shift_offset: 0,
    output_vhs_tape_speed: SP,
  }
}
