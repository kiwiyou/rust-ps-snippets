# Base Template

You can use scanf. Not the best API, but I think it fits best for PS area.

```rust,noplayground
fn solve() {
    scanf!("%d%d", a: i32, b: i32);
    println!("{}", a + b);
}

fn main() {
    unsafe {
        *stdin |= 0x8000;
        STDOUT = Some(BufWriter::with_capacity(1 << 17, File::from_raw_fd(1)));
    }
    solve();
    unsafe {
        STDOUT.as_mut().unwrap_unchecked().flush().ok();
        _exit(0);
    }
}

use std::{fs::File, io::*, os::unix::io::FromRawFd};

static mut STDOUT: Option<BufWriter<File>> = None;

#[macro_export]
macro_rules! println {
    ($($t:tt)*) => { unsafe { writeln!(STDOUT.as_mut().unwrap_unchecked(), $($t)*).unwrap_unchecked() } };
}
#[macro_export]
macro_rules! print {
    ($($t:tt)*) => { unsafe { write!(STDOUT.as_mut().unwrap_unchecked(), $($t)*).unwrap_unchecked() } };
}
#[macro_export]
macro_rules! flush {
    () => {
        unsafe {
            STDOUT
                .as_mut()
                .unwrap_unchecked()
                .flush()
                .unwrap_unchecked()
        }
    };
}

#[macro_export]
macro_rules! scanf {
    ($fmt:literal $(, $($t:tt)+)?) => {
        scanf!(@def $($($t)+)?);
        scanf!(@call $($($t)+)?, $fmt);
        scanf!(@bind $($($t)+)?);
    };
    (@def) => {};
    (@def $(mut)? $name:ident: [u8; $size:expr] $(, $($t:tt)+)?) => {
        let mut $name = vec![0u8; $size + 1];
        scanf!(@def $($($t)+)?);
    };
    (@def $(mut)? $name:ident: $ty:ty $(, $($t:tt)+)?) => {
        let mut $name = std::mem::MaybeUninit::<$ty>::uninit();
        scanf!(@def $($($t)+)?);
    };
    ($($names:ident),* @call $fmt:literal) => {
        unsafe {
            fscanf(stdin, concat!($fmt, "\0").as_ptr(), $($names.as_mut_ptr()),*);
        };
    };
    ($($names:ident),* @call $(mut)? $name:ident: [u8; $size:expr] $(, $($t:tt)+)?) => {
        scanf!($($names,)* $name @call $($($t)+)?);
    };
    ($($names:ident),* @call $(mut)? $name:ident: $ty:ty $(, $($t:tt)+)?) => {
        scanf!($($names,)* $name @call $($($t)+)?);
    };
    (@bind) => {};
    (@bind $name:ident: [u8; $size:expr] $(, $($t:tt)+)?) => {
        $name.pop();
        let $name = unsafe { String::from_utf8_unchecked($name) };
        scanf!(@bind $($($t)+)?);
    };
    (@bind mut $name:ident: [u8; $size:expr] $(, $($t:tt)+)?) => {
        $name.pop();
        let mut $name = unsafe { String::from_utf8_unchecked($name) };
        scanf!(@bind $($($t)+)?);
    };
    (@bind $name:ident: $ty:ty $(, $($t:tt)+)?) => {
        let $name = unsafe { $name.assume_init() };
        scanf!(@bind $($($t)+)?);
    };
    (@bind mut $name:ident: $ty:ty $(, $($t:tt)+)?) => {
        let mut $name = unsafe { $name.assume_init() };
        scanf!(@bind $($($t)+)?);
    };
}

#[link(name = "c")]
extern "C" {
    fn fscanf(file: *mut usize, fmt: *const u8, ...) -> i32;
    fn _exit(code: i32) -> !;
    static stdin: *mut usize;
}

