# Pseudo Random Number Generator

Reference: https://github.com/BrutPitt/fastPRNG

```rust,noplayground
struct Rng([u64; 4]);

impl Rng {
    fn split_mix(v: u64) -> u64 {
        let mut z = v.wrapping_add(0x9e3779b97f4a7c15);
        z = (z ^ (z >> 30)).wrapping_mul(0xbf58476d1ce4e5b9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94d049bb133111eb);
        z ^ (z >> 31)
    }
    fn new() -> Self {
        let mut seed = 0;
        // This is hardware RNG
        unsafe { std::arch::x86_64::_rdrand64_step(&mut seed) };
        let mut prev = seed;
        Self(std::array::from_fn(|_| {
            prev = Self::split_mix(prev);
            prev
        }))
    }
    fn next(&mut self, n: u64) -> u64 {
        let [x, y, z, c] = &mut self.0;
        let t = x.wrapping_shl(58) + *c;
        *c = *x >> 6;
        *x = x.wrapping_add(t);
        if *x < t {
            *c += 1;
        }
        *z = z.wrapping_mul(6906969069).wrapping_add(1234567);
        *y ^= y.wrapping_shl(13);
        *y ^= *y >> 17;
        *y ^= y.wrapping_shl(43);
        let base = x.wrapping_add(*y).wrapping_add(*z);
        ((base as u128 * n as u128) >> 64) as u64
    }
}
```
