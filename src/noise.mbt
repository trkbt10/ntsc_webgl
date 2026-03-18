///|
/// Add luminance noise (precise path: sample-by-sample with IIR smoothing).
pub fn video_noise(
  yiq : YiqFrame,
  field : Int,
  noise_level : Int,
  rng : XorWow,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let noise_mod = noise_level * 2 + 1
  let mut noise = 0
  for row = field; row < height; row = row + 2 {
    let y_off = yiq.y_offset(row)
    for x in 0..<width {
      yiq.data[y_off + x] = yiq.data[y_off + x] + noise
      noise = noise + (rng.rand() % noise_mod - noise_level)
      noise = noise / 2
    }
  }
}

///|
/// Add chrominance noise to I and Q channels.
pub fn video_chroma_noise(
  yiq : YiqFrame,
  field : Int,
  noise_level : Int,
  rng : XorWow,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let noise_mod = noise_level * 2 + 1
  let mut noise_u = 0
  let mut noise_v = 0
  for row = field; row < height; row = row + 2 {
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    for x in 0..<width {
      yiq.data[i_off + x] = yiq.data[i_off + x] + noise_u
      noise_u = noise_u + (rng.rand() % noise_mod - noise_level)
      noise_u = noise_u / 2
      yiq.data[q_off + x] = yiq.data[q_off + x] + noise_v
      noise_v = noise_v + (rng.rand() % noise_mod - noise_level)
      noise_v = noise_v / 2
    }
  }
}

///|
/// Add chroma phase noise (per-scanline random phase rotation of I/Q).
pub fn video_chroma_phase_noise(
  yiq : YiqFrame,
  field : Int,
  noise_level : Int,
  rng : XorWow,
) -> Unit {
  let width = yiq.width
  let height = yiq.height
  let noise_mod = noise_level * 2 + 1
  let mut noise = 0
  for row = field; row < height; row = row + 2 {
    noise = noise + (rng.rand() % noise_mod - noise_level)
    noise = noise / 2
    let pi = noise.to_double() * @math.PI / 100.0
    let sinpi = @math.sin(pi)
    let cospi = @math.cos(pi)
    let i_off = yiq.i_offset(row)
    let q_off = yiq.q_offset(row)
    for x in 0..<width {
      let u = yiq.data[i_off + x].to_double()
      let v = yiq.data[q_off + x].to_double()
      yiq.data[i_off + x] = (u * cospi - v * sinpi).to_int()
      yiq.data[q_off + x] = (u * sinpi + v * cospi).to_int()
    }
  }
}
