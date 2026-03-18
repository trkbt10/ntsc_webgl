///|
fn main {
  ()
}

///|
let processor_ref : Ref[@ntsc.NtscProcessor?] = { val: None }

///|
let input_buf : Ref[FixedArray[Byte]?] = { val: None }

///|
let output_buf : Ref[FixedArray[Byte]?] = { val: None }

///|
let frame_width : Ref[Int] = { val: 0 }

///|
let frame_height : Ref[Int] = { val: 0 }

///|
/// Initialize processor with given frame dimensions.
pub fn init_processor(width : Int, height : Int) -> Unit {
  frame_width.val = width
  frame_height.val = height
  let size = width * height * 4
  input_buf.val = Some(FixedArray::make(size, b'\x00'))
  output_buf.val = Some(FixedArray::make(size, b'\x00'))
  let config = @ntsc.NtscConfig::new()
  processor_ref.val = Some(@ntsc.NtscProcessor::new(config))
}

///|
/// Set a named parameter on the processor config.
pub fn set_param(name : String, value : Double) -> Unit {
  match processor_ref.val {
    None => ()
    Some(proc) => {
      let config = proc.config
      match name {
        "video_noise" => config.video_noise = value.to_int()
        "video_chroma_noise" => config.video_chroma_noise = value.to_int()
        "video_chroma_phase_noise" =>
          config.video_chroma_phase_noise = value.to_int()
        "composite_preemphasis" => config.composite_preemphasis = value
        "subcarrier_amplitude" => {
          config.subcarrier_amplitude = value.to_int()
          config.subcarrier_amplitude_back = value.to_int()
        }
        "video_scanline_phase_shift" =>
          config.video_scanline_phase_shift = value.to_int()
        "emulating_vhs" => config.emulating_vhs = value > 0.5
        "vhs_speed" =>
          config.output_vhs_tape_speed = match value.to_int() {
            0 => @ntsc.SP
            1 => @ntsc.LP
            _ => @ntsc.EP
          }
        "vhs_head_switching" => config.vhs_head_switching = value > 0.5
        "color_bleed_horiz" => config.color_bleed_horiz = value.to_int()
        "color_bleed_vert" => config.color_bleed_vert = value.to_int()
        "composite_in_chroma_lowpass" =>
          config.composite_in_chroma_lowpass = value > 0.5
        "composite_out_chroma_lowpass" =>
          config.composite_out_chroma_lowpass = value > 0.5
        "vhs_out_sharpen" => config.vhs_out_sharpen = value
        "vhs_edge_wave" => config.vhs_edge_wave = value.to_int()
        "video_chroma_loss" => config.video_chroma_loss = value.to_int()
        _ => ()
      }
    }
  }
}

///|
/// Push RGBA frame data as latin1-encoded string.
pub fn push_frame(data : String) -> Unit {
  match input_buf.val {
    None => ()
    Some(buf) => {
      let len = buf.length().min(data.length())
      for i in 0..<len {
        buf[i] = data[i].to_int().to_byte()
      }
    }
  }
}

///|
/// Process one frame.
pub fn process_frame() -> Unit {
  match (processor_ref.val, input_buf.val, output_buf.val) {
    (Some(proc), Some(inp), Some(out)) => {
      inp.blit_to(out, len=inp.length())
      proc.process_frame(inp, frame_width.val, frame_height.val, out)
    }
    _ => ()
  }
}

///|
/// Get output data length.
pub fn get_output_length() -> Int {
  match output_buf.val {
    Some(buf) => buf.length()
    None => 0
  }
}

///|
/// Get a chunk of output data as latin1-encoded string.
pub fn get_output_chunk(offset : Int, length : Int) -> String {
  match output_buf.val {
    None => ""
    Some(buf) => {
      let actual_len = length.min(buf.length() - offset)
      let sb = StringBuilder::new(size_hint=actual_len)
      for i in 0..<actual_len {
        sb.write_char(buf[offset + i].to_int().unsafe_to_char())
      }
      sb.to_string()
    }
  }
}
