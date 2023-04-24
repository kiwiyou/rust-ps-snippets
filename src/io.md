# Fast IO

```rust,noplayground
struct Reader {
    begin: *const u8,
    cur: *const u8,
    end: *const u8,
    goff: usize,
    cap: usize,
}

struct Writer {
    buf: Vec<u8>,
    off: usize,
}

impl Drop for Writer {
    fn drop(&mut self) {
        self.flush();
    }
}

#[repr(align(16))]
struct B128([u8; 16]);
#[target_feature(enable = "avx2")]
unsafe fn cvt8(out: &mut B128, n: u32) -> usize {
    use std::arch::x86_64::*;
    let x = _mm_cvtsi32_si128(n as i32);
    let div_10000 = _mm_set1_epi32(0xd1b71759u32 as i32);
    let mul_10000_merge = _mm_set1_epi32(55536);
    let div_var = _mm_setr_epi16(
        8389,
        5243,
        13108,
        0x8000u16 as i16,
        8389,
        5243,
        13108,
        0x8000u16 as i16,
    );
    let shift_var = _mm_setr_epi16(
        1 << 7,
        1 << 11,
        1 << 13,
        (1 << 15) as i16,
        1 << 7,
        1 << 11,
        1 << 13,
        (1 << 15) as i16,
    );
    let mul_10 = _mm_set1_epi16(10);
    let ascii0 = _mm_set1_epi8(48);
    let x_div_10000 = _mm_srli_epi64::<45>(_mm_mul_epu32(x, div_10000));
    let y = _mm_add_epi32(x, _mm_mul_epu32(x_div_10000, mul_10000_merge));
    let t0 = _mm_slli_epi16::<2>(_mm_shuffle_epi32::<5>(_mm_unpacklo_epi16(y, y)));
    let t1 = _mm_mulhi_epu16(t0, div_var);
    let t2 = _mm_mulhi_epu16(t1, shift_var);
    let t3 = _mm_slli_epi64::<16>(t2);
    let t4 = _mm_mullo_epi16(t3, mul_10);
    let t5 = _mm_sub_epi16(t2, t4);
    let t6 = _mm_packus_epi16(_mm_setzero_si128(), t5);
    let mask = _mm_movemask_epi8(_mm_cmpeq_epi8(t6, _mm_setzero_si128()));
    let offset = (mask & !0x8000).trailing_ones() as usize;
    let ascii = _mm_add_epi8(t6, ascii0);
    _mm_store_si128(out.0.as_mut_ptr().cast(), ascii);
    offset
}

impl Reader {
    fn new(capacity: usize) -> Self {
        let ptr;
        unsafe {
            std::arch::asm!(
                "syscall",
                inout("rax") 9usize => ptr,
                in("rdi") 0,
                in("rsi") capacity,
                in("rdx") 3,
                in("r10") 2,
                in("r8") 0,
                in("r9") 0,
                out("rcx") _,
                out("r11") _,
                options(nomem,preserves_flags)
            );
        }
        Self {
            begin: ptr,
            end: unsafe { ptr.add(capacity) },
            cur: ptr,
            goff: 0,
            cap: capacity,
        }
    }
    fn try_refill(&mut self, readahead: usize) {
        if unsafe { self.cur.add(readahead) } <= self.end {
            return;
        }
        self.goff += unsafe { self.cur.offset_from(self.begin) } as usize;
        let add = self.goff & 4095;
        self.goff &= !4095;
        let ptr;
        unsafe {
            std::arch::asm!(
                "syscall",
                inout("rax") 9usize => ptr,
                in("rdi") self.begin,
                in("rsi") self.cap,
                in("rdx") 3,
                in("r10") 18,
                in("r8") 0,
                in("r9") self.goff,
                out("rcx") _,
                out("r11") _,
                options(nomem,preserves_flags)
            );
        }
        self.begin = ptr;
        self.cur = unsafe { self.begin.add(add) };
        self.end = unsafe { self.begin.add(self.cap) };
    }
    fn read_until(&mut self, delim: u8, buf: &mut String) -> usize {
        #[target_feature(enable = "avx2,sse4.2")]
        unsafe fn memchr(s: &[u8], delim: u8) -> Option<usize> {
            s.iter().position(|&b| b == delim)
        }
        let mut total = 0;
        loop {
            let len = unsafe { self.end.offset_from(self.cur) } as usize;
            let range = unsafe { std::slice::from_raw_parts(self.cur, len) };
            if let Some(i) = unsafe { memchr(range, delim) } {
                unsafe { buf.as_mut_vec() }.extend_from_slice(&range[..i]);
                self.cur = unsafe { self.cur.add(i + 1) };
                break total + i;
            } else {
                unsafe { buf.as_mut_vec() }.extend_from_slice(&range);
                self.cur = self.end;
                self.try_refill(1);
                total += len;
            }
        }
    }
    fn read_i32(&mut self) -> i32 {
        let sign = unsafe { self.cur.read() } == b'-';
        (if sign {
            self.cur = unsafe { self.cur.add(1) };
            self.read_u32().wrapping_neg()
        } else {
            self.read_u32()
        }) as i32
    }
    fn read_i64(&mut self) -> i64 {
        let sign = unsafe { self.cur.read() } == b'-';
        (if sign {
            self.cur = unsafe { self.cur.add(1) };
            self.read_u64().wrapping_neg()
        } else {
            self.read_u64()
        }) as i64
    }
    fn read_u32(&mut self) -> u32 {
        let mut c = unsafe { self.cur.cast::<u64>().read_unaligned() };
        let m = !c & 0x1010101010101010;
        let len = m.trailing_zeros() >> 3;
        c <<= (8 - len) << 3;
        c = ((c & 0x0F0F0F0F0F0F0F0F) * 2561) >> 8;
        c = ((c & 0x00FF00FF00FF00FF) * 6553601) >> 16;
        c = ((c & 0x0000FFFF0000FFFF) * 42949672960001) >> 32;
        self.cur = unsafe { self.cur.add(len as usize) };
        if len == 8 {
            if unsafe { self.cur.read() } & 0x10 != 0 {
                c *= 10;
                c += (unsafe { self.cur.read() } - b'0') as u64;
                self.cur = unsafe { self.cur.add(1) };
            }
            if unsafe { self.cur.read() } & 0x10 != 0 {
                c *= 10;
                c += (unsafe { self.cur.read() } - b'0') as u64;
                self.cur = unsafe { self.cur.add(1) };
            }
            if unsafe { self.cur.read() } & 0x10 != 0 {
                c *= 10;
                c += (unsafe { self.cur.read() } - b'0') as u64;
                self.cur = unsafe { self.cur.add(1) };
            }
        }
        self.cur = unsafe { self.cur.add(1) };
        c as u32
    }
    fn read_u64(&mut self) -> u64 {
        #[target_feature(enable = "avx2,sse4.2")]
        unsafe fn parse_u64(p: *const u8) -> (i32, u64) {
            use std::arch::x86_64::*;
            let load = _mm_loadu_si128(p.cast());
            let digits = _mm_set_epi8(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 57, 48);
            let len = _mm_cmpistri::<
                { _SIDD_UBYTE_OPS | _SIDD_CMP_RANGES | _SIDD_NEGATIVE_POLARITY },
            >(digits, load);
            let asciiz = _mm_set1_epi8(48);
            let idx = _mm_set_epi8(15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0);
            let len_b = _mm_set1_epi8(len as i8 - 1);
            let shuffle = _mm_sub_epi8(len_b, idx);
            let numeric = _mm_sub_epi8(load, asciiz);
            let shuffled = _mm_shuffle_epi8(numeric, shuffle);
            let multwo = _mm_set1_epi16(10 << 8 | 1);
            let two = _mm_maddubs_epi16(shuffled, multwo);
            let mulfour = _mm_set1_epi32(100 << 16 | 1);
            let four = _mm_madd_epi16(two, mulfour);
            let packed = _mm_packus_epi32(four, four);
            let muleight = _mm_set1_epi32(10000 << 16 | 1);
            let eight = _mm_madd_epi16(packed, muleight);
            let x: [u32; 4] = std::mem::transmute(eight);
            (len, x[1] as u64 * 100000000 + x[0] as u64)
        }
        let (len, mut c) = unsafe { parse_u64(self.cur) };
        self.cur = unsafe { self.cur.add(len as usize) };
        if len == 16 {
            if unsafe { self.cur.read() } & 0x10 != 0 {
                c *= 10;
                c += (unsafe { self.cur.read() } - b'0') as u64;
                self.cur = unsafe { self.cur.add(1) };
            }
            if unsafe { self.cur.read() } & 0x10 != 0 {
                c *= 10;
                c += (unsafe { self.cur.read() } - b'0') as u64;
                self.cur = unsafe { self.cur.add(1) };
            }
        }
        self.cur = unsafe { self.cur.add(1) };
        c
    }
}

impl Writer {
    fn new(capacity: usize) -> Self {
        Self {
            buf: vec![0; capacity],
            off: 0,
        }
    }
    fn flush(&mut self) {
        unsafe {
            std::arch::asm!(
                "syscall",
                inout("rax") 1 => _,
                in("rdi") 1,
                in("rsi") self.buf.as_ptr(),
                in("rdx") self.off,
                out("rcx") _,
                out("r11") _,
                options(readonly,preserves_flags)
            )
        }
        self.off = 0;
    }
    fn try_flush(&mut self, readahead: usize) {
        if self.off + readahead > self.buf.len() {
            self.flush();
        }
    }
    fn byte(&mut self, b: u8) {
        self.try_flush(1);
        self.buf[self.off] = b;
        self.off += 1;
    }
    fn bytes(&mut self, s: &[u8]) {
        let mut i = 0;
        while i < s.len() {
            let rem = s[i..].len().min(self.buf[self.off..].len());
            self.buf[self.off..self.off + rem].copy_from_slice(&s[i..i + rem]);
            self.off += rem;
            i += rem;
            if self.off == self.buf.len() {
                self.flush();
            }
        }
    }
    fn i32(&mut self, n: i32) {
        if n < 0 {
            self.byte(b'-');
            self.u32((n as u32).wrapping_neg());
        } else {
            self.u32(n as u32);
        }
    }
    fn u32(&mut self, n: u32) {
        let mut b128 = B128([0u8; 16]);
        let mut off;
        if n >= 100_000_000 {
            self.try_flush(10);
            let mut hi = n / 100_000_000;
            let lo = n % 100_000_000;
            unsafe { cvt8(&mut b128, lo) };
            off = 8;
            off -= 1;
            b128.0[off] = (hi % 10) as u8 + b'0';
            if hi >= 10 {
                off -= 1;
                hi /= 10;
                b128.0[off] = hi as u8 + b'0';
            }
        } else {
            self.try_flush(8);
            off = unsafe { cvt8(&mut b128, n) };
        }
        let len = 16 - off;
        self.buf[self.off..self.off + len].copy_from_slice(&b128.0[off..]);
        self.off += len;
    }
    fn i64(&mut self, n: i64) {
        if n < 0 {
            self.byte(b'-');
            self.u64((n as u64).wrapping_neg());
        } else {
            self.u64(n as u64);
        }
    }
    fn u64(&mut self, n: u64) {
        let mut hi128 = B128([0u8; 16]);
        let mut lo128 = B128([0u8; 16]);
        let mut hioff;
        let looff;
        if n >= 10_000_000_000_000_000 {
            self.try_flush(19);
            let mut hi = (n / 10_000_000_000_000_000) as u32;
            let lo = n % 10_000_000_000_000_000;
            let lohi = (lo / 100_000_000) as u32;
            let lolo = (lo % 100_000_000) as u32;
            unsafe { cvt8(&mut hi128, lohi) };
            unsafe { cvt8(&mut lo128, lolo) };
            hioff = 8;
            looff = 8;
            hioff -= 1;
            hi128.0[hioff] = (hi % 10) as u8 + b'0';
            if hi >= 10 {
                hioff -= 1;
                hi /= 10;
                hi128.0[hioff] = (hi % 10) as u8 + b'0';
            }
            if hi >= 100 {
                hioff -= 1;
                hi /= 10;
                hi128.0[hioff] = hi as u8 + b'0';
            }
        } else if n >= 100_000_000 {
            self.try_flush(16);
            let hi = (n / 100_000_000) as u32;
            let lo = (n % 100_000_000) as u32;
            hioff = unsafe { cvt8(&mut hi128, hi) };
            unsafe { cvt8(&mut lo128, lo) };
            looff = 8;
        } else {
            self.try_flush(8);
            hioff = 0;
            looff = unsafe { cvt8(&mut lo128, n as u32) };
        }
        let len = 16 - hioff;
        self.buf[self.off..self.off + len].copy_from_slice(&hi128.0[hioff..]);
        self.off += len;
        let len = 16 - looff;
        self.buf[self.off..self.off + len].copy_from_slice(&lo128.0[looff..]);
        self.off += len;
    }
}

```
