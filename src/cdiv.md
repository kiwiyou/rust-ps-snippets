# Constant Division / Modulo

Speed up division and modulo calculation using precomputation.

reference: [Daniel Lemire](https://lemire.me/blog/2019/02/20/more-fun-with-fast-remainders-when-the-divisor-is-a-constant/)

```rust,noplayground
#[derive(Copy, Clone)]
struct ModU32(u64, u32);

impl ModU32 {
    const fn new(div: u32) -> Self {
        Self((!0 / div as u64).wrapping_add(1), div)
    }
    const fn rem(&self, a: u32) -> u32 {
        let low = self.0.wrapping_mul(a as u64);
        ((low as u128 * self.1 as u128) >> 64) as u32
    }
    const fn quot(&self, a: u32) -> u32 {
        ((self.0 as u128 * a as u128) >> 64) as u32
    }
    const fn quotrem(&self, a: u32) -> (u32, u32) {
        let full = self.0 as u128 * a as u128;
        let quot = full >> 64;
        let rem = (full as u64 as u128 * self.1 as u128) >> 64;
        (quot as u32, rem as u32)
    }
    const fn divisible(&self, a: u32) -> bool {
        self.0.wrapping_mul(a as u64) <= self.0.wrapping_sub(1)
    }
}

/// d != 0 && d != i32::MIN
#[derive(Copy, Clone)]
struct ModI32(u64, i32);

impl ModI32 {
    const fn new(div: i32) -> Self {
        let abs = div.abs();
        let mut m = (!0 / abs as u64).wrapping_add(1);
        if (abs & (abs - 1)) == 0 {
            m += 1;
        }
        Self(m, div)
    }
    const fn rem(&self, a: i32) -> i32 {
        let low = self.0.wrapping_mul(a as u64);
        let high = ((low as u128 * self.1.abs() as u128) >> 64) as i32;
        high - ((self.1 - 1) & (a >> 31))
    }
    const fn quot(&self, a: i32) -> i32 {
        let mut high = ((self.0 as i128 * a as i128) >> 64) as u64;
        if a < 0 {
            high = high.wrapping_add(1);
        }
        if self.1 < 0 {
            -(high as i32)
        } else {
            high as i32
        }
    }
    const fn quotrem(&self, a: i32) -> (i32, i32) {
        let full = self.0 as i128 * a as i128;
        let mut high = (full >> 64) as u64;
        if a < 0 {
            high = high.wrapping_add(1);
        }
        let quot = if self.1 < 0 {
            -(high as i32)
        } else {
            high as i32
        };
        let mut rem = ((full as u64 as u128 * self.1.abs() as u128) >> 64) as i32;
        rem -= ((self.1 - 1) & a >> 31);
        (quot, rem)
    }
}

#[derive(Copy, Clone)]
struct ModU64(u128, u64);

impl ModU64 {
    const fn new(div: u64) -> Self {
        Self((!0u128 / div as u128).wrapping_add(1), div)
    }
    const fn multop(a: u128, b: u64) -> u64 {
        let mut bottom = (a as u64 as u128) * b as u128;
        bottom >>= 64;
        let top = (a >> 64) * b as u128;
        ((bottom + top) >> 64) as u64
    }
    const fn rem(&self, a: u64) -> u64 {
        let low = self.0.wrapping_mul(a as u128);
        Self::multop(low, self.1)
    }
    const fn quot(&self, a: u64) -> u64 {
        Self::multop(self.0, a)
    }
    const fn divisible(&self, a: u64) -> bool {
        self.0.wrapping_mul(a as u128) <= self.0.wrapping_sub(1)
    }
}

#[derive(Copy, Clone)]
struct BarrettU32(u64, u32);

impl BarrettU32 {
    fn new(div: u32) -> Self {
        Self(!0u64 / div as u64, div)
    }
    fn quot(&self, a: u64) -> u64 {
        ((self.0 as u128 * a as u128) >> 64) as u64
    }
    fn rem(&self, a: u64) -> u32 {
        (a - self.quot(a) * self.1 as u64) as u32
    }
}
```
