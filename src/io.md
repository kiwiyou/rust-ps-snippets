# Fast IO

```rust,noplayground
#![no_main]

fn solve(stdin: &mut Reader) {}

#[no_mangle]
unsafe fn main() -> i32 {
    use std::io::*;
    STDOUT = Some(BufWriter::with_capacity(
        1 << 17,
        <std::fs::File as std::os::unix::io::FromRawFd>::from_raw_fd(1),
    ));
    solve(&mut Reader::new(1 << 19));
    STDOUT.as_mut().unwrap().flush().ok();
    0
}

static mut STDOUT: Option<std::io::BufWriter<std::fs::File>> = None;

#[macro_export]
macro_rules! println {
    ($($t:tt)*) => {{
        use std::io::*;
        writeln!(unsafe { STDOUT.as_mut() }.unwrap(), $($t)*).unwrap()
    }};
}
#[macro_export]
macro_rules! print {
    ($($t:tt)*) => {{
        use std::io::*;
        write!(unsafe { STDOUT.as_mut() }.unwrap(), $($t)*).unwrap()
    }};
}
#[macro_export]
macro_rules! flush {
    () => {
        std::io::Write::flush(unsafe { STDOUT.as_mut() }.unwrap()).unwrap()
    };
}

#[link(name = "c")]
extern "C" {}

struct Reader {
    begin: *const u8,
    cur: *const u8,
    end: *const u8,
    goff: usize,
    cap: usize,
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
```
