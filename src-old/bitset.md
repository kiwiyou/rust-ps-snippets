# Bitset

```rust,noplayground
struct Bitset(Vec<u64>, usize);

impl Bitset {
    fn new(n: usize) -> Self {
        let v = vec![0; (n + 63) / 64];
        Self(v, n)
    }
    fn len(&self) -> usize {
        self.1
    }
    fn set(&mut self, i: usize, v: bool) {
        if v {
            self.0[i / 64] |= 1 << (i % 64);
        } else {
            self.0[i / 64] &= !(1 << (i % 64));
        }
    }
    #[target_feature(enable = "avx2")]
    unsafe fn shr(&self, x: usize) -> Self {
        let mut shr = Self::new(self.len() - x);
        let x_chunk = x / 64;
        let x_inside = (x % 64) as u32;
        if x_inside == 0 {
            for (dest, &src) in shr.0.iter_mut().zip(self.0[x_chunk..].iter()) {
                *dest = src;
            }
        } else {
            for (dest, &src) in shr.0.iter_mut().zip(self.0[x_chunk..].iter()) {
                *dest = src >> x_inside;
            }
            for (dest, &src) in shr.0.iter_mut().zip(self.0[x_chunk + 1..].iter()) {
                *dest |= (src & ((1 << x_inside) - 1)) << (64 - x_inside);
            }
        }
        shr
    }
    fn flip(&mut self, i: usize) {
        self.0[i / 64] ^= 1 << (i % 64);
    }
    fn shl(&self, x: usize) -> Self {
        let mut shl = unsafe { Self::new(self.len() + x) };
        let x_chunk = x / 64;
        let x_inside = (x % 64) as u32;
        if x_inside == 0 {
            for (dest, &src) in shl.0.iter_mut().skip(x_chunk).zip(self.0) {
                *dest = src.wrapping_shl(x_inside);
            }
        } else {
            let mut low = 0;
            for (dest, &src) in shl.0.iter_mut().skip(x_chunk).zip(self.0) {
                *dest = src.wrapping_shl(x_inside) | low;
                low = src >> (64 - x_inside);
            }
            if shl.0.len() > self.0.len() + x_chunk {
                *shl.0.last_mut().unwrap() = low;
            }
        }
        shl
    }
    #[target_feature(enable = "avx2")]
    unsafe fn or(&mut self, other: &Self) {
        for (a, &b) in self.0.iter_mut().zip(&other.0) {
            *a |= b;
        }
    }
}

impl std::fmt::Debug for Bitset {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let mut iter = self.0.iter().rev().skip_while(|&&b| b == 0);
        if let Some(&first) = iter.next() {
            write!(f, "{first:b}")?;
            for &b in iter {
                write!(f, "{b:064b}")?;
            }
            Ok(())
        } else {
            write!(f, "0")
        }
    }
}
```
