///|
/// XorWow pseudo-random number generator.
/// Faithful port of the Python XorWowRandom class.
pub(all) struct XorWow {
  mut x : Int
  mut y : Int
  mut z : Int
  mut w : Int
  mut v : Int
  mut addend : Int
}

///|
/// Unsigned right shift for Int (treating as uint32).
fn ushr(value : Int, shift : Int) -> Int {
  (value.reinterpret_as_uint() >> shift).reinterpret_as_int()
}

///|
pub fn XorWow::new(seed1 : Int, seed2 : Int) -> XorWow {
  let rng : XorWow = {
    x: seed1,
    y: seed2,
    z: 0,
    w: 0,
    v: -seed1 - 1,
    addend: (seed1 << 10) ^ ushr(seed2, 4),
  }
  // Warm up 64 rounds
  for _ in 0..<64 {
    let _ = rng.next_raw()
  }
  rng
}

///|
/// Raw next int (internal, matches Python _nextInt).
fn XorWow::next_raw(self : XorWow) -> Int {
  let mut t = self.x
  t = t ^ ushr(t, 2)
  self.x = self.y
  self.y = self.z
  self.z = self.w
  let v0 = self.v
  self.w = v0
  t = t ^ (t << 1) ^ v0 ^ (v0 << 4)
  self.v = t
  self.addend = self.addend + 362437
  t + self.addend
}

///|
/// Next random int in range [0, Int.max_value).
/// Matches Python rand() which calls nextInt(_from=0).
pub fn XorWow::rand(self : XorWow) -> Int {
  self.next_int(from=0, until=2147483647)
}

///|
/// Next random int in range [from, until).
/// Uses rejection sampling for uniform distribution.
pub fn XorWow::next_int(self : XorWow, from~ : Int, until~ : Int) -> Int {
  let n = until - from
  if n <= 0 {
    return from
  }
  while true {
    let bits = ushr(self.next_raw(), 1)
    let v = bits % n
    if bits - v + (n - 1) >= 0 {
      return from + v
    }
  }
  from // unreachable
}
