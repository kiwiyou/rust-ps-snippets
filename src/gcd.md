# GCD

```rust,noplayground
fn gcd(mut a: i32, mut b: i32) -> i32 {
    if a == 0 || b == 0 {
        a + b
    } else {
        let az = a.trailing_zeros();
        let bz = b.trailing_zeros();
        let s = az.min(bz);
        a >>= az;
        b >>= bz;
        while a != 0 {
            let d = a - b;
            (a, b) = (d.abs(), a.min(b));
            a >>= d.trailing_zeros();
        }
        b << s
    }
}

/// Returns 3-tuple `(g, x, y)` that satisfies ax + by = g = gcd(a, b).
fn egcd(mut a: i64, mut b: i64) -> (i64, i64, i64) {
    let (mut x, mut y, mut x1, mut y1) = (1, 0, 0, 1);
    while b != 0 {
        let q = a / b;
        (x, x1) = (x1, x - q * x1);
        (y, y1) = (y1, y - q * y1);
        (a, b) = (b, a - q * b);
    }
    (a, x, y)
}
```

