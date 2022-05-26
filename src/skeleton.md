# Skeleton

Skeleton for BOJ solution code.

```rust,ignore
#![no_main]
use std::arch::asm;

#[no_mangle]
fn main() {
    let mut reader = Reader::new();
    let mut writer = Writer::default();
}

struct Reader(*const u8);

trait Readable: Sized {
    fn read(reader: &mut Reader) -> Self;
}

impl Reader {
    fn new() -> Self {
        let stat = [0isize; 20];
        let mut ptr: *const u8;
        unsafe {
            asm!("syscall", in("rax") 5, in("rdi") 0, in("rsi") stat.as_ptr());
            asm!("syscall", in("rax") 9, in("rdi") 0, in("rsi") stat[6], in("rdx") 1, in("r10") 2, in("r8") 0, in("r9") 0, lateout("rax") ptr);
        }
        Self(ptr)
    }

    #[inline(always)]
    fn read<T: Readable>(&mut self) -> T {
        T::read(self)
    }

    #[inline(always)]
    fn skip(&mut self) {
        while unsafe { *self.0 } <= 32 {
            self.0 = unsafe { self.0.offset(1) };
        }
    }
}

impl Readable for &'static [u8] {
    #[inline(always)]
    fn read(r: &mut Reader) -> Self {
        r.skip();
        let begin = r.0;
        let mut end = begin;
        while unsafe { *end } > 32 {
            end = unsafe { end.offset(1) };
        }
        unsafe { std::slice::from_raw_parts(begin, end.offset_from(begin) as usize) }
    }
}

#[derive(Default)]
struct Writer(Vec<u8>);

trait Writable {
    fn write(self, writer: &mut Writer);
}

impl Drop for Writer {
    fn drop(&mut self) {
        unsafe {
            asm!("syscall", in("rax") 1, in("rdi") 1, in("rsi") self.0.as_ptr(), in("rdx") self.0.len());
        }
    }
}

impl Writer {
    #[inline(always)]
    fn write<T: Writable>(&mut self, v: T) {
        v.write(self);
    }
}

macro_rules! binary_search {
    ($i:ident, $buf:ident, $w:ident { $v:literal }) => {{
        for i in 0..$v {
            $buf[19 - i] += ($i % 10) as u8;
            $i /= 10;
        }
        $w.0.extend_from_slice(&$buf[20 - $v..]);
    }};
    ($i:ident, $buf:ident, $w:ident { $cond:literal $t:tt $f:tt }) => {
        if $i < $cond { binary_search!($i, $buf, $w $t) } else { binary_search!($i, $buf, $w $f) }
    };
}

impl Writable for u64 {
    #[inline(always)]
    fn write(mut self, w: &mut Writer) {
        let mut b = [b'0'; 20];
        binary_search!(self, b, w {10000000000{100000{100{10{1}{2}}{10000{1000{3}{4}}{5}}}{10000000{1000000{6}{7}}{1000000000{100000000{8}{9}}{10}}}}{1000000000000000{1000000000000{100000000000{11}{12}}{100000000000000{10000000000000{13}{14}}{15}}}{100000000000000000{10000000000000000{16}{17}}{10000000000000000000{1000000000000000000{18}{19}}{20}}}}})
    }
}

impl Writable for i64 {
    #[inline(always)]
    fn write(self, w: &mut Writer) {
        let v = if self < 0 {
            w.0.push(b'-');
            self.abs_diff(0)
        } else {
            self as u64
        };
        w.write(v);
    }
}

macro_rules! impl_read {
    (@loop $l:literal $v:ident $r:ident $t:ident) => {{
        let mut $v = unsafe { *$r.0 } as $t & 15;
        for _ in 0..$l  {
            $r.0 = unsafe { $r.0.offset(1) };
            if unsafe { *$r.0 } & 48 != 48 {
                break;
            }
            $v = $v * 10 + (unsafe { *$r.0 } as $t & 15);
        }
        $v
    }};
    ($($s:ident $u:ident: $l:literal),+) => {$(
        impl Readable for $u {
            #[inline(always)]
            fn read(r: &mut Reader) -> Self {
                r.skip();
                impl_read!(@loop $l v r $u)
            }
        }
        impl Readable for $s {
            #[inline(always)]
            fn read(r: &mut Reader) -> Self {
                r.skip();
                let sign = unsafe { *r.0 } == b'-';
                if sign {
                    r.0 = unsafe { r.0.offset(1) };
                }
                let v = impl_read!(@loop $l v r $u);
                if sign { -(v as $s) } else { v as $s }
            }
        }
    )+};
}
impl_read!(i8 u8: 3, i16 u16: 6, i32 u32: 10, i64 u64: 18);

macro_rules! impl_write {
    ($($s:ident $u:ident),+) => {$(
        impl Writable for $u {
            #[inline(always)]
            fn write(self, w: &mut Writer) {
                w.write(self as u64);
            }
        }
        impl Writable for $s {
            #[inline(always)]
            fn write(self, w: &mut Writer) {
                let v = if self < 0 {
                    w.0.push(b'-');
                    self.abs_diff(0)
                } else {
                    self as $u
                };
                w.write(v);
            }
        }
    )+};
}

impl_write!(i8 u8, i16 u16, i32 u32);
```

## `Writer` Example

```rust,ignore
let mut writer = Writer::default();
writer.write(1u8);
writer.write(-7i32);
writer.0.extend_from_slice(b"test");
```
