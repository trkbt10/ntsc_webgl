///|
/// Benchmark: full pipeline (320x240, default config)
test "bench_pipeline_320x240" (b : @bench.T) {
  let width = 320
  let height = 240
  let rgba_in = FixedArray::make(width * height * 4, b'\x80')
  for i in 0..<(width * height) {
    rgba_in[i * 4 + 3] = b'\xFF'
  }
  let rgba_out = FixedArray::make(width * height * 4, b'\x00')
  rgba_in.blit_to(rgba_out, len=rgba_in.length())
  let config = NtscConfig::new()
  let proc = NtscProcessor::new(config)
  b.bench(fn() { proc.process_frame(rgba_in, width, height, rgba_out) })
}

///|
/// Benchmark: rgba2yiq conversion (320x240)
test "bench_rgba2yiq_320x240" (b : @bench.T) {
  let width = 320
  let height = 240
  let rgba = FixedArray::make(width * height * 4, b'\x80')
  for i in 0..<(width * height) {
    rgba[i * 4 + 3] = b'\xFF'
  }
  let yiq = YiqFrame::new(width, height)
  b.bench(fn() { rgba2yiq(rgba, width, height, yiq) })
}

///|
/// Benchmark: yiq2rgba conversion (320x240)
test "bench_yiq2rgba_320x240" (b : @bench.T) {
  let width = 320
  let height = 240
  let yiq = YiqFrame::new(width, height)
  // Fill with some data
  for i in 0..<yiq.data.length() {
    yiq.data[i] = 128 * 256
  }
  let dst = FixedArray::make(width * height * 4, b'\x00')
  b.bench(fn() { yiq2rgba(yiq, 0, dst) })
}

///|
/// Benchmark: composite_lowpass (320x240)
test "bench_composite_lowpass_320x240" (b : @bench.T) {
  let width = 320
  let height = 240
  let yiq = YiqFrame::new(width, height)
  for i in 0..<yiq.data.length() {
    yiq.data[i] = 128 * 256
  }
  b.bench(fn() { composite_lowpass(yiq, 0, 0) })
}

///|
/// Benchmark: chroma_into_luma + chroma_from_luma (320x240)
test "bench_chroma_encode_decode_320x240" (b : @bench.T) {
  let width = 320
  let height = 240
  let yiq = YiqFrame::new(width, height)
  for i in 0..<yiq.data.length() {
    yiq.data[i] = 128 * 256
  }
  b.bench(fn() {
    chroma_into_luma(yiq, 0, 0, 50, 180, 0)
    chroma_from_luma(yiq, 0, 0, 50, 180, 0)
  })
}

///|
/// Benchmark: video_noise (320x240)
test "bench_video_noise_320x240" (b : @bench.T) {
  let width = 320
  let height = 240
  let yiq = YiqFrame::new(width, height)
  let rng = XorWow::new(31374242, 0)
  b.bench(fn() { video_noise(yiq, 0, 2, rng) })
}
