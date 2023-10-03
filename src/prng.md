# Pseudo Random Number Generator

Reference: https://github.com/BrutPitt/fastPRNG

```rust,noplayground

struct Rng32([u32; 4]);

impl Rng32 {
    fn split_mix(v: u32) -> u32 {
        let mut z = v.wrapping_add(0x9e3779b9);
        z = (z ^ (z >> 15)).wrapping_mul(0x85ebca6b);
        z = (z ^ (z >> 13)).wrapping_mul(0xc2b2ae35);
        z ^ (z >> 16)
    }
    fn new() -> Self {
        let mut seed = 0;
        unsafe { std::arch::x86_64::_rdrand32_step(&mut seed) };
        let mut prev = seed;
        Self(std::array::from_fn(|_| {
            prev = Self::split_mix(prev);
            prev
        }))
    }
    fn next(&mut self, n: u32) -> u32 {
        let [x, y, z, w] = &mut self.0;
        let res = x.wrapping_add(*w);
        let t = x.wrapping_shl(9);
        *y ^= *x;
        *w ^= *y;
        *y ^= *z;
        *x ^= *w;
        *z ^= t;
        *w = w.rotate_left(11);
        ((res as u64 * n as u64) >> 32) as u32
    }
}

struct Rng64([u64; 4]);

impl Rng64 {
    fn split_mix(v: u64) -> u64 {
        let mut z = v.wrapping_add(0x9e3779b97f4a7c15);
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }
    fn new() -> Self {
        let mut seed = 0;
        unsafe { std::arch::x86_64::_rdrand64_step(&mut seed) };
        let mut prev = seed;
        Self(std::array::from_fn(|_| {
            prev = Self::split_mix(prev);
            prev
        }))
    }
    fn next(&mut self, n: u64) -> u64 {
        let [x, y, z, w] = &mut self.0;
        let res = x.wrapping_add(*w);
        let t = x.wrapping_shl(17);
        *y ^= *x;
        *w ^= *y;
        *y ^= *z;
        *x ^= *w;
        *z ^= t;
        *w = w.rotate_left(45);
        ((res as u128 * n as u128) >> 64) as u64
    }
}
```
