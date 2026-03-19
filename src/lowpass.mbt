///|
/// First-order IIR lowpass/highpass filter.
pub(all) struct LowpassFilter {
  alpha : Double
  mut prev : Double
}

///|
pub fn LowpassFilter::new(
  rate : Double,
  hz : Double,
  value? : Double = 0.0,
) -> LowpassFilter {
  let time_interval = 1.0 / rate
  let tau = 1.0 / (hz * 2.0 * @math.PI)
  let alpha = time_interval / (tau + time_interval)
  { alpha, prev: value }
}

///|
/// Apply lowpass filter to a single sample.
pub fn LowpassFilter::lowpass(self : LowpassFilter, sample : Double) -> Double {
  self.prev = sample * self.alpha + self.prev * (1.0 - self.alpha)
  self.prev
}

///|
/// Apply highpass filter to a single sample.
pub fn LowpassFilter::highpass(self : LowpassFilter, sample : Double) -> Double {
  self.prev = sample * self.alpha + self.prev * (1.0 - self.alpha)
  sample - self.prev
}

///|
/// Apply lowpass filter to an int array (one scanline).
/// Reads from data[src_off..src_off+len], writes to data[dst_off..dst_off+len].
/// src and dst may overlap if src_off == dst_off.
pub fn LowpassFilter::lowpass_array_inplace(
  self : LowpassFilter,
  data : FixedArray[Int],
  src_off : Int,
  dst_off : Int,
  len : Int,
) -> Unit {
  for i in 0..<len {
    let sample = data[src_off + i].to_double()
    self.prev = sample * self.alpha + self.prev * (1.0 - self.alpha)
    data[dst_off + i] = self.prev.to_int()
  }
}

///|
/// Apply lowpass filter to a double array, return as double array.
pub fn LowpassFilter::lowpass_doubles(
  self : LowpassFilter,
  src : FixedArray[Double],
  dst : FixedArray[Double],
  len : Int,
) -> Unit {
  for i in 0..<len {
    self.prev = src[i] * self.alpha + self.prev * (1.0 - self.alpha)
    dst[i] = self.prev
  }
}

///|
/// Apply lowpass to int array, storing result in a separate double temp buffer.
/// Returns the filtered values as int written back to dst.
pub fn LowpassFilter::lowpass_array(
  self : LowpassFilter,
  src : FixedArray[Int],
  src_off : Int,
  dst : FixedArray[Int],
  dst_off : Int,
  len : Int,
) -> Unit {
  for i in 0..<len {
    let sample = src[src_off + i].to_double()
    self.prev = sample * self.alpha + self.prev * (1.0 - self.alpha)
    dst[dst_off + i] = self.prev.to_int()
  }
}

///|
/// Apply highpass filter to an int array.
pub fn LowpassFilter::highpass_array(
  self : LowpassFilter,
  src : FixedArray[Int],
  src_off : Int,
  dst : FixedArray[Double],
  dst_off : Int,
  len : Int,
) -> Unit {
  for i in 0..<len {
    let sample = src[src_off + i].to_double()
    self.prev = sample * self.alpha + self.prev * (1.0 - self.alpha)
    dst[dst_off + i] = sample - self.prev
  }
}

///|
/// Create 3 lowpass filters with the same parameters (for cascading).
pub fn lowpass_filters(
  cutoff : Double,
  reset? : Double = 0.0,
  rate? : Double = NTSC_RATE,
) -> (LowpassFilter, LowpassFilter, LowpassFilter) {
  (
    LowpassFilter::new(rate, cutoff, value=reset),
    LowpassFilter::new(rate, cutoff, value=reset),
    LowpassFilter::new(rate, cutoff, value=reset),
  )
}

///|
/// Compute filter alpha from rate and cutoff frequency.
pub fn lowpass_alpha(rate : Double, hz : Double) -> Double {
  let time_interval = 1.0 / rate
  let tau = 1.0 / (hz * 2.0 * @math.PI)
  time_interval / (tau + time_interval)
}

///|
/// Apply 3-stage cascade lowpass filter inline (no LowpassFilter struct allocation per row).
/// Reads from src[src_off..src_off+len], writes final result to dst[dst_off..dst_off+len].
/// IMPORTANT: src[src_off..] is overwritten with pass-2 intermediate during processing.
/// If you need the original src data after calling this, save it first.
pub fn lowpass_cascade3(
  src : FixedArray[Int],
  src_off : Int,
  dst : FixedArray[Int],
  dst_off : Int,
  len : Int,
  alpha : Double,
  reset~ : Double = 0.0,
) -> Unit {
  let one_minus_alpha = 1.0 - alpha
  // Pass 1: src -> dst
  let mut prev = reset
  for i in 0..<len {
    let sample = src[src_off + i].to_double()
    prev = sample * alpha + prev * one_minus_alpha
    dst[dst_off + i] = prev.to_int()
  }
  // Pass 2: dst -> src (OVERWRITES src!)
  prev = reset
  for i in 0..<len {
    let sample = dst[dst_off + i].to_double()
    prev = sample * alpha + prev * one_minus_alpha
    src[src_off + i] = prev.to_int()
  }
  // Pass 3: src -> dst
  prev = reset
  for i in 0..<len {
    let sample = src[src_off + i].to_double()
    prev = sample * alpha + prev * one_minus_alpha
    dst[dst_off + i] = prev.to_int()
  }
}
