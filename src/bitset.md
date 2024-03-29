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
    fn len(&self) -> usize {
        self.1
    }
    fn get(&self, i: usize) -> bool {
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr() as *const u64, self.0.len() * 4) };
        b64[i / 64] & (1 << (i % 64)) != 0
    }
    fn set(&mut self, i: usize, v: bool) {
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
        let b64 = unsafe {
            std::slice::from_raw_parts_mut(self.0.as_mut_ptr() as *mut u64, self.0.len() * 4)
        };
        b64[i / 64] ^= 1 << (i % 64);
    }
    fn shl(&self, x: usize) -> Self {
        let mut shl = unsafe { Self::new(self.len() + x) };
        let shl_b64 = unsafe {
            std::slice::from_raw_parts_mut(shl.0.as_mut_ptr().cast::<u64>(), (shl.len() + 63) / 64)
        };
        let b64 = unsafe {
            std::slice::from_raw_parts(self.0.as_ptr().cast::<u64>(), (self.len() + 63) / 64)
        };
        let x_chunk = x / 64;
        let x_inside = (x % 64) as u32;
        if x_inside == 0 {
            for (dest, &src) in shl_b64.iter_mut().skip(x_chunk).zip(b64) {
                *dest = src.wrapping_shl(x_inside);
            }
        } else {
            let mut low = 0;
            for (dest, &src) in shl_b64.iter_mut().skip(x_chunk).zip(b64) {
                *dest = src.wrapping_shl(x_inside) | low;
                low = src >> (64 - x_inside);
            }
            if shl_b64.len() > b64.len() + x_chunk {
                *shl_b64.last_mut().unwrap() = low;
            }
        }
        shl
    }
    #[target_feature(enable = "avx2")]
    unsafe fn or(&mut self, other: &Self) {
        for (a, &b) in self.0.iter_mut().zip(&other.0) {
            *a = std::arch::x86_64::_mm256_or_si256(*a, b);
        }
    }
    fn split_range(mut begin: usize, end: usize) -> Option<(usize, usize)> {
        let back = end & !255;
        if begin & 255 != 0 {
            begin += 256 - (begin & 255);
        }
        if begin < back {
            Some((begin, back))
        } else {
            None
        }
    }
    #[target_feature(enable = "avx2")]
    unsafe fn find_first_unset(&self, l: usize, r: usize) -> Option<usize> {
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr() as *const u64, self.0.len() * 4) };
        if let Some((le, rb)) = Self::split_range(l, r) {
            for i in l..le {
                if b64[i >> 6] & (1 << (i & 63)) == 0 {
                    return Some(i);
                }
            }
            let mut mask = 0;
            if let Some(mut i) = self.0[le >> 8..rb >> 8].iter().position(|p| {
                use std::arch::x86_64::*;
                let v256 = unsafe { _mm256_load_si256(p) };
                let zero = unsafe { _mm256_set1_epi8(-1) };
                let nonzero = unsafe { _mm256_cmpeq_epi8(zero, v256) };
                mask = unsafe { _mm256_movemask_epi8(nonzero) } as u32;
                mask != !0
            }) {
                i += le >> 8;
                let j = (0..32).position(|s| mask & (1 << s) == 0).unwrap();
                let b8 = unsafe {
                    std::slice::from_raw_parts(self.0.as_ptr() as *const u8, self.0.len() * 32)
                };
                let k = b8[i * 32 + j].trailing_ones() as usize;
                let begin = (i * 32 + j) * 8 + k;
                return Some(begin);
            }
            for i in rb..r {
                if b64[i >> 6] & (1 << (i & 63)) == 0 {
                    return Some(i);
                }
            }
            None
        } else {
            for i in l..r {
                if b64[i >> 6] & (1 << (i & 63)) == 0 {
                    return Some(i);
                }
            }
            None
        }
    }
    #[target_feature(enable = "avx2")]
    unsafe fn find_first_set(&self, l: usize, r: usize) -> Option<usize> {
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr() as *const u64, self.0.len() * 4) };
        if let Some((le, rb)) = Self::split_range(l, r) {
            for i in l..le {
                if b64[i >> 6] & (1 << (i & 63)) != 0 {
                    return Some(i);
                }
            }
            let mut mask = 0;
            if let Some(mut i) = self.0[le >> 8..rb >> 8].iter().position(|p| {
                use std::arch::x86_64::*;
                let v256 = unsafe { _mm256_load_si256(p) };
                let zero = unsafe { _mm256_setzero_si256() };
                let nonzero = unsafe { _mm256_cmpeq_epi8(zero, v256) };
                mask = unsafe { _mm256_movemask_epi8(nonzero) } as u32;
                mask != !0
            }) {
                i += le >> 8;
                let j = (0..32).position(|s| mask & (1 << s) == 0).unwrap();
                let b8 = unsafe {
                    std::slice::from_raw_parts(self.0.as_ptr() as *const u8, self.0.len() * 32)
                };
                let k = b8[i * 32 + j].trailing_zeros() as usize;
                let begin = (i * 32 + j) * 8 + k;
                return Some(begin);
            }
            for i in rb..r {
                if b64[i >> 6] & (1 << (i & 63)) != 0 {
                    return Some(i);
                }
            }
            None
        } else {
            for i in l..r {
                if b64[i >> 6] & (1 << (i & 63)) != 0 {
                    return Some(i);
                }
            }
            None
        }
    }
    #[target_feature(enable = "avx2")]
    unsafe fn flip_range(&mut self, l: usize, r: usize) {
        let b64 = std::slice::from_raw_parts_mut(self.0.as_mut_ptr() as *mut u64, self.0.len() * 4);
        if let Some((le, rb)) = Self::split_range(l, r) {
            use std::arch::x86_64::*;
            for i in l..le {
                b64[i >> 6] ^= 1 << (i & 63);
            }
            let one = _mm256_set1_epi8(-1);
            for v in &mut self.0[le >> 8..rb >> 8] {
                let load = _mm256_load_si256(v);
                let xor = _mm256_xor_si256(load, one);
                _mm256_store_si256(v, xor);
            }
            for i in rb..r {
                b64[i >> 6] ^= 1 << (i & 63);
            }
        } else {
            for i in l..r {
                b64[i >> 6] ^= 1 << (i & 63);
            }
        }
    }
    #[target_feature(enable = "avx2")]
    unsafe fn count_ones(&mut self, l: usize, r: usize) -> u32 {
        let b64 = std::slice::from_raw_parts_mut(self.0.as_mut_ptr() as *mut u64, self.0.len() * 4);
        let mut count = 0;
        if let Some((le, rb)) = Self::split_range(l, r) {
            use std::arch::x86_64::*;
            for i in l..le {
                if b64[i >> 6] & 1 << (i & 63) != 0 {
                    count += 1;
                }
            }
            let b0 = _mm256_set1_epi32(0x55555555);
            let b1 = _mm256_set1_epi32(0x33333333);
            let b2 = _mm256_set1_epi32(0x0f0f0f0f);
            let b3 = _mm256_set1_epi32(0x01010101);
            let mut vcount = _mm256_setzero_si256();
            for v in &mut self.0[le >> 8..rb >> 8] {
                let load = _mm256_load_si256(v);
                let c1 = _mm256_sub_epi32(load, _mm256_and_si256(b0, _mm256_srli_epi32::<1>(load)));
                let c2 = _mm256_add_epi32(
                    _mm256_and_si256(c1, b1),
                    _mm256_and_si256(_mm256_srli_epi32::<2>(c1), b1),
                );
                let c3 = _mm256_srli_epi32::<24>(_mm256_mullo_epi32(
                    _mm256_and_si256(_mm256_add_epi32(c2, _mm256_srli_epi32::<4>(c2)), b2),
                    b3,
                ));
                vcount = _mm256_add_epi32(vcount, c3);
            }
            let [a, b, c, d, e, f, g, h]: [u32; 8] = std::mem::transmute(vcount);
            count += a + b + c + d + e + f + g + h;
            for i in rb..r {
                if b64[i >> 6] & 1 << (i & 63) != 0 {
                    count += 1;
                }
            }
        } else {
            for i in l..r {
                if b64[i >> 6] & 1 << (i & 63) != 0 {
                    count += 1;
                }
            }
        }
        count
    }
}

impl std::fmt::Debug for Bitset {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let b64 =
            unsafe { std::slice::from_raw_parts(self.0.as_ptr().cast::<u64>(), self.0.len() * 4) };
        let mut iter = b64.iter().rev().skip_while(|&&b| b == 0);
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
