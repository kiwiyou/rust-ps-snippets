# Mulmod

Computes 64bit a times b mod c, returning quotient and remainder

```rs
fn mulmod(a: u64, b: u64, c: u64) -> (u64, u64) {
    let (quot, rem);
    unsafe {
        std::arch::asm!(
            "mul {b}",
            "div {c}",
            inout("rax") a => quot,
            b = in(reg) b,
            c = in(reg) c,
            out("rdx") rem, 
            options(nomem, pure)
        )
    };
    (quot, rem)
}
```
