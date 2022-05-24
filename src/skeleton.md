# Skeleton

Skeleton for BOJ solution code.

```rust,ignore
use std::io::{stdout, Write};

fn main() {
    let mut reader = Reader::new();
    let mut writer = Writer::default();
}

struct Reader(&'static [u8]);

extern "C" {
    fn mmap(addr: usize, len: usize, p: i32, f: i32, fd: i32, o: i64) -> *mut u8;
    fn fstat(fd: i32, stat: *mut usize) -> i32;
}

impl Reader {
    fn new() -> Self {
        let mut stat = [0; 20];
        unsafe { fstat(0, stat.as_mut_ptr()) };
        let buffer = unsafe { mmap(0, stat[6], 1, 2, 0, 0) };
        Self(unsafe { std::slice::from_raw_parts(buffer, stat[6]) })
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
        stdout().write_all(&self.0).ok();
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

```rust
use std::io::{stdout, Write};

fn main() {
    let mut writer = Writer::default();
    writer.write(1u8);
    writer.write(-7i32);
    writer.write(b"test");
    writer.write(format_args!("Complex {:07}", 42));
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
        stdout().write_all(&self.0).ok();
    }
}

trait Writable {
    fn write(self, writer: &mut Writer);
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
        writer.0.write_fmt(self);
    }
}

macro_rules! impl_urw {
    ($($t:ty),+) => { $(
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
