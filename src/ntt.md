# Number Theoretic Transform

```rust,noplayground
struct NttParam {
    m: ModU64,
    u: u64,
    ui: u64,
    s: u32,
}

static NTT: &[NttParam] = &[NttParam {
    m: ModU64::new(998244353),
    u: 15311432,
    ui: 469870224,
    s: 23,
}, NttParam {
    m: ModU64::new(1107296257),
    u: 1087287097,
    ui: 623044540,
    s: 25,
}];

impl NttParam {
    fn run(&self, a: &mut [u32], inv: bool) {
        let n = a.len();
        let s = n.leading_zeros() + 1;
        for i in 0..n {
            let r = i.reverse_bits() >> s;
            if i < r {
                a.swap(i, r);
            }
        }
        let u = if inv { self.ui } else { self.u };
        for k in 1..=n.trailing_zeros() {
            let mut wlen = u;
            for _ in k..self.s {
                wlen = self.m.rem(wlen * wlen);
            }
            let kh = 1 << (k - 1);
            for i in 0..(n + (1 << k) - 1) >> k {
                let i = i << k;
                let mut w = 1;
                for j in 0..kh {
                    let u = a[i + j] as u64;
                    let v = self.m.rem(a[i + j + kh] as u64 * w);
                    let mut s = u + v;
                    if s >= self.m.1 {
                        s -= self.m.1;
                    }
                    a[i + j] = s as u32;
                    let mut d = u + self.m.1 - v;
                    if d >= self.m.1 {
                        d -= self.m.1;
                    }
                    a[i + j + kh] = d as u32;
                    w = self.m.rem(w * wlen);
                }
            }
        }
        if inv {
            let p = self.m.1 as i64;
            let ni = ((egcd(n as i64, p).1 % p + p) % p) as u64;
            for x in a {
                *x = self.m.rem(*x as u64 * ni) as u32;
            }
        }
    }
}

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

#[derive(Copy, Clone)]
struct ModU64(u128, u64);

impl ModU64 {
    const fn new(div: u64) -> Self {
        Self((!0u128 / div as u128).wrapping_add(1), div)
    }
    fn multop(a: u128, b: u64) -> u64 {
        let mut bottom = (a as u64 as u128) * b as u128;
        bottom >>= 64;
        let top = (a >> 64) * b as u128;
        ((bottom + top) >> 64) as u64
    }
    fn rem(&self, a: u64) -> u64 {
        let low = self.0.wrapping_mul(a as u128);
        Self::multop(low, self.1)
    }
}
```
