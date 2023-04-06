# Bitset

```rust,noplayground
struct Bitset(Vec<std::arch::x86_64::__m256i>, usize);

impl Bitset {
    #[target_feature(enable = "avx2")]
    unsafe fn new(n: usize) -> Self {
        use std::arch::x86_64::*;
        let mut v = vec![];
        v.resize_with((n + 255) / 256, || unsafe { _mm256_setzero_si256() });
        Self(v, n)
    }
    fn get(&self, i: usize) -> bool {
        assert!(i < self.1);
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr() as *const u64, self.0.len() * 4) };
        b64[i / 64] & (1 << (i % 64)) != 0
    }
    fn set(&mut self, i: usize, v: bool) {
        assert!(i < self.1);
        let b64 = unsafe {
            std::slice::from_raw_parts_mut(self.0.as_mut_ptr() as *mut u64, self.0.len() * 4)
        };
        if v {
            b64[i / 64] |= 1 << (i % 64);
        } else {
            b64[i / 64] &= !(1 << (i % 64));
        }
    }
    fn flip(&mut self, i: usize) {
        assert!(i < self.1);
        let b64 = unsafe {
            std::slice::from_raw_parts_mut(self.0.as_mut_ptr() as *mut u64, self.0.len() * 4)
        };
        b64[i / 64] ^= 1 << (i % 64);
    }
    #[target_feature(enable = "avx2")]
    unsafe fn find_first_unset(&self, mut begin: usize) -> Option<usize> {
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr() as *const u64, self.0.len() * 4) };
        while begin % 64 != 0 && begin < self.1 {
            if b64[begin / 64] & (1 << (begin % 64)) == 0 {
                return (begin < self.1).then_some(begin);
            }
            begin += 1;
        }
        while begin % 256 != 0 && begin < self.1 {
            let offset = b64[begin / 64].trailing_ones() as usize;
            begin += offset;
            if offset != 64 {
                return (begin < self.1).then_some(begin);
            }
        }
        let mut mask = 0;
        if begin < self.1 {
            let i = begin / 256
                + self.0[begin / 256..].iter().position(|p| {
                    use std::arch::x86_64::*;
                    let v256 = unsafe { _mm256_load_si256(p) };
                    let zero = unsafe { _mm256_set1_epi8(-1) };
                    let nonzero = unsafe { _mm256_cmpeq_epi8(zero, v256) };
                    mask = unsafe { _mm256_movemask_epi8(nonzero) } as u32;
                    mask != !0
                })?;
            let j = (0..32).position(|s| mask & (1 << s) == 0).unwrap();
            let b8 = unsafe {
                std::slice::from_raw_parts(self.0.as_ptr() as *const u8, self.0.len() * 32)
            };
            let k = b8[i * 32 + j].trailing_ones() as usize;
            let begin = (i * 32 + j) * 8 + k;
            (begin < self.1).then_some(begin)
        } else {
            None
        }
    }
    #[target_feature(enable = "avx2")]
    unsafe fn find_first_set(&self, mut begin: usize) -> Option<usize> {
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr() as *const u64, self.0.len() * 4) };
        while begin % 64 != 0 && begin < self.1 {
            if b64[begin / 64] & (1 << (begin % 64)) != 0 {
                return (begin < self.1).then_some(begin);
            }
            begin += 1;
        }
        while begin % 256 != 0 && begin < self.1 {
            let offset = b64[begin / 64].trailing_zeros() as usize;
            begin += offset;
            if offset != 64 {
                return (begin < self.1).then_some(begin);
            }
        }
        let mut mask = 0;
        if begin < self.1 {
            let i = begin / 256
                + self.0[begin / 256..].iter().position(|p| {
                    use std::arch::x86_64::*;
                    let v256 = unsafe { _mm256_load_si256(p) };
                    let zero = unsafe { _mm256_setzero_si256() };
                    let nonzero = unsafe { _mm256_cmpeq_epi8(zero, v256) };
                    mask = unsafe { _mm256_movemask_epi8(nonzero) } as u32;
                    mask != !0
                })?;
            let j = (0..32).position(|s| mask & (1 << s) == 0).unwrap();
            let b8 = unsafe {
                std::slice::from_raw_parts(self.0.as_ptr() as *const u8, self.0.len() * 32)
            };
            let k = b8[i * 32 + j].trailing_zeros() as usize;
            let begin = (i * 32 + j) * 8 + k;
            (begin < self.1).then_some(begin)
        } else {
            None
        }
    }
}
```
