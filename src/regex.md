# Regex

Use POSIX library function.

```rust,noplayground
struct Regexp([u64; 8]);
extern "C" {
    fn regcomp(preg: *mut u64, pattern: *const u8, flags: i32);
    fn regexec(preg: *const u64, s: *const u8, n_expr: usize, m: *mut i32, flags: i32) -> i32;
}

impl Regexp {
    fn new(pattern: &str, case_insensitive: bool) -> Self {
        let flag = if case_insensitive { 3 } else { 1 };
        let mut tmp = pattern.as_bytes().to_vec();
        tmp.push(0);
        let mut v = [0; 8];
        unsafe { regcomp(v.as_mut_ptr(), tmp.as_ptr(), flag) };
        Self(v)
    }

    fn find(&self, text: &str) -> Option<(usize, usize)> {
        // ALL THESE UNSAFE's ARE UB. Only for intended use.
        let end = unsafe { text.as_ptr().cast_mut().add(text.len()) };
        let save = unsafe { end.read_volatile() };
        unsafe { end.write_volatile(0) };
        let mut m = [0; 2];
        let result = unsafe { regexec(self.0.as_ptr(), text.as_ptr(), 1, m.as_mut_ptr(), 0) };
        unsafe { end.write_volatile(save) };
        if result == 0 {
            Some((m[0] as usize, m[1] as usize))
        } else {
            None
        }
    }
}
```
