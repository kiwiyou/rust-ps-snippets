# Skeleton

Skeleton for BOJ solution code.

```rust,ignore
#![no_main]
use std::{arch::asm, io::{stdout, Write}};

#[no_mangle]
fn main() {
    let mut reader = Reader::new();
    let mut writer = Writer::default();
}

struct Reader(&'static [u8]);

impl Reader {
    fn new() -> Self {
        let mut stat = [0usize; 20];
        let buf = *const u8;
        unsafe {
            asm!("syscall", in("rax") 5, in("rdi") 0, in("rsi") stat.as_ptr());
            asm!("syscall", in("rax") 9, in("rdi") 0, in("rsi") stat[6], in("rdx") 1, in("r10") 2, in("r8") 0, in("r9") 0, lateout("rax") buf);
        }
        Self(unsafe { std::slice::from_raw_parts(buf, stat[6]) })
    }

    fn read<T: Readable>(&mut self) -> T {
        T::read(self)
    }

    fn iter<T: Readable>(&mut self) -> impl Iterator<Item = T> + '_ {
        std::iter::repeat_with(|| self.read())
    }
}

#[derive(Default)]
struct Writer(Vec<u8>);

impl Writer {
    fn write<T: Writable>(&mut self, value: T) {
        value.write(self)
    }
}

impl Drop for Writer {
    fn drop(&mut self) {
        unsafe {
            asm!("syscall", in("rax") 1, in("rdi") 1, in("rsi") self.0.as_ptr(), in("rdx") self.0.len());
        }
    }
}

trait Readable: Sized {
    fn read(reader: &mut Reader) -> Self;
}

trait Writable {
    fn write(self, writer: &mut Writer);
}

impl Readable for &'_ [u8] {
    fn read(reader: &mut Reader) -> Self {
        reader.0.split(|&b| b <= 32).next().unwrap()
    }
}

impl Writable for &'_ [u8] {
    fn write(self, writer: &mut Writer) {
        writer.0.extend_from_slice(self);
    }
}

impl<const N: usize> Writable for &'_ [u8; N] {
    fn write(self, writer: &mut Writer) {
        writer.0.extend_from_slice(self);
    }
}

impl Writable for std::fmt::Arguments<'_> {
    fn write(self, writer: &mut Writer) {
        writer.0.write_fmt(self).ok();
    }
}

macro_rules! impl_urw {
    ($($t:ty),+) => { $(
        impl Readable for $t {
            fn read(reader: &mut Reader) -> Self {
                let mut v = 0;
                loop {
                    let (&c, rest) = reader.0.split_first().unwrap();
                    reader.0 = rest;
                    if c & 0x30 == 0x30 {
                        v = v * 10 + (c & 0x0f) as Self;
                    } else {
                        break v;
                    }
                }
            }
        }
        impl Writable for $t {
            fn write(self, writer: &mut Writer) {
                if self >= 10 {
                    writer.write(self / 10);
                }
                writer.0.push(b'0' + (self % 10) as u8);
            }
        }
    )+ };
}

impl_urw!(u8, u16, u32, u64, usize);

macro_rules! impl_srw {
    ($($u:ty, $i:ty),+) => { $(
        impl Readable for $i {
            fn read(reader: &mut Reader) -> Self {
                let (&c, rest) = reader.0.split_first().unwrap();
                if c == b'-' {
                    reader.0 = rest;
                    -(reader.read::<$u>() as Self)
                } else {
                    reader.read::<$u>() as Self
                }
            }
        }
        impl Writable for $i {
            fn write(self, writer: &mut Writer) {
                let abs = if self < 0 {
                    writer.0.push(b'-');
                    -self
                } else {
                    self
                };
                writer.write(abs as $u);
            }
        }
    )+ };
}

impl_srw!(u8, i8, u16, i16, u32, i32, u64, i64, usize, isize);
```

## `Writer` Example

```rust,ignore
let mut writer = Writer::default();
writer.write(1u8);
writer.write(-7i32);
writer.write(b"test");
writer.write(format_args!("Complex {:07}", 42));
```
