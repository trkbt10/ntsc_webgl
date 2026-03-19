///|
test "XorWow deterministic output" {
  let rng = XorWow::new(31374242, 0)
  let v1 = rng.rand()
  let v2 = rng.rand()
  let v3 = rng.rand()
  assert_true(v1 != 0)
  assert_true(v2 != 0)
  assert_true(v3 != 0)
  assert_true(v1 != v2)
  let rng2 = XorWow::new(31374242, 0)
  assert_eq(rng2.rand(), v1)
  assert_eq(rng2.rand(), v2)
  assert_eq(rng2.rand(), v3)
}

///|
test "XorWow range" {
  let rng = XorWow::new(12345, 67890)
  for _ in 0..<100 {
    let v = rng.next_int(from=0, until=100)
    assert_true(v >= 0 && v < 100)
  }
}

///|
test "RGB-YIQ round trip" {
  let width = 4
  let height = 2
  let rgba = FixedArray::make(width * height * 4, b'\x00')
  for i in 0..<(width * height) {
    rgba[i * 4 + 3] = b'\xFF'
  }
  rgba[0] = b'\xFF'
  rgba[5] = b'\xFF'
  rgba[10] = b'\xFF'
  rgba[12] = b'\xFF'
  rgba[13] = b'\xFF'
  rgba[14] = b'\xFF'
  let yiq = YiqFrame::new(width, height)
  rgba2yiq(rgba, width, height, yiq)
  let out = FixedArray::make(width * height * 4, b'\x00')
  yiq2rgba(yiq, 0, out)
  yiq2rgba(yiq, 1, out)
  for i in 0..<(width * height * 4) {
    let diff = (rgba[i].to_int() - out[i].to_int()).abs()
    assert_true(diff <= 3)
  }
}

///|
test "RGB-YIQ round trip - all primary colors" {
  let width = 8
  let height = 2
  let rgba = FixedArray::make(width * height * 4, b'\x00')
  // Set up 8 test colors: black, red, green, blue, cyan, magenta, yellow, white
  let colors : Array[(Byte, Byte, Byte)] = [
    (b'\x00', b'\x00', b'\x00'),
    (b'\xFF', b'\x00', b'\x00'),
    (b'\x00', b'\xFF', b'\x00'),
    (b'\x00', b'\x00', b'\xFF'),
    (b'\x00', b'\xFF', b'\xFF'),
    (b'\xFF', b'\x00', b'\xFF'),
    (b'\xFF', b'\xFF', b'\x00'),
    (b'\xFF', b'\xFF', b'\xFF'),
  ]
  for i in 0..<8 {
    let (r, g, b) = colors[i]
    // Row 0
    rgba[i * 4] = r
    rgba[i * 4 + 1] = g
    rgba[i * 4 + 2] = b
    rgba[i * 4 + 3] = b'\xFF'
    // Row 1 (same)
    rgba[(width + i) * 4] = r
    rgba[(width + i) * 4 + 1] = g
    rgba[(width + i) * 4 + 2] = b
    rgba[(width + i) * 4 + 3] = b'\xFF'
  }
  let yiq = YiqFrame::new(width, height)
  rgba2yiq(rgba, width, height, yiq)
  let out = FixedArray::make(width * height * 4, b'\x00')
  yiq2rgba(yiq, 0, out)
  yiq2rgba(yiq, 1, out)
  let mut max_diff = 0
  for i in 0..<(width * height * 4) {
    let diff = (rgba[i].to_int() - out[i].to_int()).abs()
    if diff > max_diff {
      max_diff = diff
    }
  }
  // Round trip should be within ±2 for all primary colors
  assert_true(max_diff <= 2)
}

///|
test "full pipeline no purple - gray input" {
  let width = 32
  let height = 16
  let rgba_in = FixedArray::make(width * height * 4, b'\x80')
  for i in 0..<(width * height) {
    rgba_in[i * 4 + 3] = b'\xFF'
  }
  let rgba_out = FixedArray::make(width * height * 4, b'\x00')
  rgba_in.blit_to(rgba_out, len=rgba_in.length())
  let config = NtscConfig::new()
  let proc = NtscProcessor::new(config)
  proc.process_frame(rgba_in, width, height, rgba_out)
  // Check center region (avoid edges affected by filters)
  for row in 2..<(height - 2) {
    for col in 4..<(width - 4) {
      let idx = (row * width + col) * 4
      let r = rgba_out[idx].to_int()
      let g = rgba_out[idx + 1].to_int()
      let b = rgba_out[idx + 2].to_int()
      // Gray input should produce roughly gray output
      // No channel should dominate excessively (no purple = no high R+B with low G)
      let rg = (r - g).abs()
      let rb = (r - b).abs()
      let gb = (g - b).abs()
      let max_channel_diff = if rg > rb {
        if rg > gb { rg } else { gb }
      } else if rb > gb {
        rb
      } else {
        gb
      }
      assert_true(max_channel_diff < 40)
    }
  }
}

///|
test "LowpassFilter basic" {
  let lp = LowpassFilter::new(14318181.0, 1300000.0)
  let v1 = lp.lowpass(0.0)
  assert_true(v1.abs() < 0.01)
  let v2 = lp.lowpass(1000.0)
  assert_true(v2 > 0.0 && v2 < 1000.0)
  for _ in 0..<100 {
    ignore(lp.lowpass(1000.0))
  }
  let vn = lp.lowpass(1000.0)
  assert_true((vn - 1000.0).abs() < 1.0)
}

///|
test "chroma_luma_xi phase 180" {
  for fieldno in 0..<4 {
    for row in 0..<8 {
      let xi = chroma_luma_xi(180, 0, fieldno, row)
      assert_true(xi >= 0 && xi <= 3)
    }
  }
}

///|
test "NtscConfig defaults" {
  let config = NtscConfig::new()
  assert_eq(config.video_noise, 2)
  assert_eq(config.subcarrier_amplitude, 50)
  assert_eq(config.video_scanline_phase_shift, 180)
  assert_true(config.composite_in_chroma_lowpass)
  assert_true(config.composite_out_chroma_lowpass)
  assert_true(not(config.emulating_vhs))
}

///|
test "full pipeline smoke test" {
  let width = 8
  let height = 4
  let rgba_in = FixedArray::make(width * height * 4, b'\x80')
  for i in 0..<(width * height) {
    rgba_in[i * 4 + 3] = b'\xFF'
  }
  let rgba_out = FixedArray::make(width * height * 4, b'\x00')
  rgba_in.blit_to(rgba_out, len=rgba_in.length())
  let config = NtscConfig::new()
  let proc = NtscProcessor::new(config)
  proc.process_frame(rgba_in, width, height, rgba_out)
  proc.process_frame(rgba_in, width, height, rgba_out)
  let mut has_nonzero = false
  for i in 0..<(width * height * 4) {
    if rgba_out[i] != b'\x00' {
      has_nonzero = true
      break
    }
  }
  assert_true(has_nonzero)
}
