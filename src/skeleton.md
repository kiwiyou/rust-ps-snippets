# Skeleton

Skeleton for BOJ solution code.

```rust
#![no_main]

fn main() {
    read!("%d", n: i32);
    for _ in 0..n {
        read!("%d%d", a: i32, b: i32);
        println!("{}", a + b);
    }
}

#[export_name = "main"]
unsafe fn entry() -> i32 {
    STDOUT = Some(std::io::BufWriter::with_capacity(
        1 << 17,
        std::os::unix::io::FromRawFd::from_raw_fd(0),
    ));
    main();
    std::io::Write::flush(STDOUT.as_mut().unwrap()).ok();
    0
}

static mut STDOUT: Option<std::io::BufWriter<std::fs::File>> = None;

#[link(name = "c")]
extern "C" {
    fn scanf(fmt: *const u8, ...) -> i32;
}

#[macro_export]
macro_rules! println {
    ($($tt:tt)*) => {
        use std::io::Write;
        unsafe { writeln!($crate::STDOUT.as_mut().unwrap(), $($tt)*).unwrap() }
    }
}

#[macro_export]
macro_rules! print {
    ($($tt:tt)*) => {
        use std::io::Write;
        unsafe { write!($crate::STDOUT.as_mut().unwrap(), $($tt)*).unwrap() }
    }
}

#[macro_export]
macro_rules! read {
    ($fmt:literal, $($tt:tt)*) => {
        let fmt = concat!($fmt, "\0");
        read!(@bind $($tt)*);
        read!(fmt.as_ptr(); @call $($tt)*);
        read!(@rebind $($tt)*)
    };
    (@bind) => {};
    (@bind $(mut)? $name:ident: str[$len:expr] $(, $($rest:tt)+)?) => {
        let mut $name = vec![0u8; $len + 1];
        read!(@bind $($($rest)+)?)
    };
    (@bind $(mut)? $name:ident: $type:ty $(, $($rest:tt)+)?) => {
        let mut $name: $type = Default::default();
        read!(@bind $($($rest)+)?)
    };
    ($($expr:expr;)+ @call) => {
        unsafe { scanf($($expr,)*) };
    };
    ($($expr:expr;)+ @call $(mut)? $name:ident: str[$len:expr] $(, $($rest:tt)+)?) => {
        read!($($expr;)+ $name.as_mut_ptr(); @call $($($rest)+)?)
    };
    ($($expr:expr;)+ @call $(mut)? $name:ident: $type:ty $(, $($rest:tt)+)?) => {
        read!($($expr;)+ &mut $name; @call $($($rest)+)?)
    };
    (@rebind) => {};
    (@rebind mut $name:ident: str[$len:expr] $(, $($rest:tt)+)?) => {
        let mut $name = unsafe {
            let len = $name.partition_point(|&b| b != 0);
            $name.resize(len, 0u8);
            String::from_utf8_unchecked($name)
        };
        read!(@rebind $($($rest)+)?)
    };
    (@rebind $name:ident: str[$len:expr] $(, $($rest:tt)+)?) => {
        let $name = unsafe {
            let len = $name.partition_point(|&b| b != 0);
            $name.resize(len, 0u8);
            String::from_utf8_unchecked($name)
        };
        read!(@rebind $($($rest)+)?)
    };
    (@rebind mut $name:ident: $type:ty $(, $($rest:tt)+)?) => {
        let mut $name: $type = $name;
        read!(@rebind $($($rest)+)?)
    };
    (@rebind $name:ident: $type:ty $(, $($rest:tt)+)?) => {
        let $name: $type = $name;
        read!(@rebind $($($rest)+)?)
    };
}
```
