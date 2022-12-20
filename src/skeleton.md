# Skeleton

Skeleton for BOJ solution code.

```rust
#![no_main]

fn solve(input: &str) {
}

#[no_mangle]
unsafe fn main() -> i32 {
    let mut stat = [0; 20];
    fstat(0, stat.as_mut_ptr());
    let input = mmap(std::ptr::null(), stat[6], 1, 2, 0, 0);
    solve(std::str::from_utf8_unchecked(std::slice::from_raw_parts(
        input, stat[6],
    )));
    0
}

fn print(s: &str) {
    unsafe { write(1, s.as_ptr(), s.len()) };
}

#[link(name = "c")]
extern "C" {
    fn fstat(fd: i32, stat: *mut usize);
    fn mmap(addr: *const u8, len: usize, prot: i32, flags: i32, fd: i32, off: isize) -> *const u8;
    fn write(fd: i32, s: *const u8, len: usize);
}
```
