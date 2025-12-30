# Arbitrary Precision Integer

```rust,noplayground
#[derive(Clone, PartialEq, Eq)]
struct BigInt(bool, Vec<u64>);

impl std::str::FromStr for BigInt {
    type Err = std::convert::Infallible;
    fn from_str(mut s: &str) -> std::result::Result<Self, Self::Err> {
        let sign = s.starts_with("-");
        if sign {
            s = &s[1..];
        }
        let size = (s.len() + RADIX_POW - 1) / RADIX_POW;
        let mut v = Vec::with_capacity(size);
        for c in s.as_bytes().rchunks(RADIX_POW) {
            let mut t = 0;
            for &b in c {
                t *= 10;
                t += (b - b'0') as u64;
            }
            v.push(t);
        }
        Ok(Self(sign, v))
    }
}

impl std::fmt::Display for BigInt {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if self.0 {
            write!(f, "-")?;
        }
        let mut a = self.1.iter().rev();
        let last = *a.next().unwrap();
        write!(f, "{last}")?;
        for l in a {
            write!(f, "{l:00$}", RADIX_POW)?;
        }
        Ok(())
    }
}

impl std::cmp::PartialOrd for BigInt {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl std::cmp::Ord for BigInt {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        use std::cmp::Ordering::*;
        if self.0 && !other.0 {
            Less
        } else if !self.0 && other.0 {
            Greater
        } else {
            let ord = if self.1.len() != other.1.len() {
                self.1.len().cmp(&other.1.len())
            } else {
                let mut last = Equal;
                for (l, r) in self.1.iter().rev().zip(other.1.iter().rev()) {
                    last = l.cmp(r);
                    if last != Equal {
                        break;
                    }
                }
                last
            };
            if self.0 {
                match ord {
                    Less => Greater,
                    Equal => Equal,
                    Greater => Less,
                }
            } else {
                ord
            }
        }
    }
}

const RADIX: u64 = 1_000_000;
const RADIX_POW: usize = 6;
impl BigInt {
    fn new() -> Self {
        Self(false, vec![0])
    }
    fn is_zero(&self) -> bool {
        self.1.len() == 1 && self.1[0] == 0
    }
    fn normalize(&mut self) {
        let len = self.1.iter().rposition(|&l| l != 0).unwrap_or(0) + 1;
        self.1.truncate(len);
        if self.1.len() == 1 && self.1[0] == 0 {
            self.0 = false;
        }
    }
    fn add(&mut self, rhs: &Self) {
        if self.0 == rhs.0 {
            self.unsigned_add_assign(rhs);
        } else {
            self.unsigned_sub_assign(rhs);
        }
    }
    fn sub(&mut self, rhs: &Self) {
        if self.0 == rhs.0 {
            self.unsigned_sub_assign(rhs);
        } else {
            self.unsigned_add_assign(rhs);
        }
    }
    fn divmod_scalar(&mut self, rhs: u64) -> u64 {
        let mut borrow = 0;
        for d in self.1.iter_mut().rev() {
            borrow *= RADIX;
            borrow += *d;
            (*d, borrow) = (borrow / rhs, borrow % rhs);
        }
        self.normalize();
        borrow
    }
    fn mul(&mut self, rhs: &Self) {
        const NTT_0_INV: u64 = 285212675;
        let pad = (self.1.len() + rhs.1.len() - 1).next_power_of_two();
        self.1.resize(pad, 0);
        let mut l = &mut self.1;
        let mut r = vec![0; pad];
        r[..rhs.1.len()].copy_from_slice(&rhs.1);
        let mut l1 = l.clone();
        let mut r1 = r.clone();
        NTT[0].run(&mut l, false);
        NTT[0].run(&mut r, false);
        for (l, r) in l.iter_mut().zip(r) {
            *l = NTT[0].m.rem(*l as u64 * r as u64);
        }
        NTT[0].run(&mut l, true);
        NTT[1].run(&mut l1, false);
        NTT[1].run(&mut r1, false);
        for (l, r) in l1.iter_mut().zip(r1) {
            *l = NTT[1].m.rem(*l as u64 * r as u64);
        }
        NTT[1].run(&mut l1, true);
        for (l, l1) in l.iter_mut().zip(l1) {
            let r = NTT[1].m.rem((l1 + NTT[1].m.1 - *l) * NTT_0_INV);
            *l += NTT[0].m.1 * r;
        }
        let mut carry = 0;
        for x in l {
            *x += carry;
            carry = *x / RADIX;
            *x %= RADIX;
        }
        while carry > 0 {
            self.1.push(carry % RADIX);
            carry /= RADIX;
        }
        self.0 = self.0 != rhs.0;
        self.normalize();
    }
    fn unsigned_add_assign(&mut self, rhs: &Self) {
        if rhs.is_zero() {
            return;
        } else if self.is_zero() {
            self.0 = rhs.0;
            self.1 = rhs.1.clone();
            return;
        }
        let n = self.1.len().min(rhs.1.len());
        let mut carry = 0;
        for (l, &r) in self.1[..n].iter_mut().zip(&rhs.1) {
            *l += r;
            *l += carry;
            if *l >= RADIX {
                *l -= RADIX;
                carry = 1;
            } else {
                carry = 0;
            }
        }
        for l in &mut self.1[n..] {
            *l += carry;
            if *l >= RADIX {
                *l -= RADIX;
                carry = 1;
            } else {
                carry = 0;
                break;
            }
        }
        for &r in &rhs.1[n..] {
            let mut l = r + carry;
            if l >= RADIX {
                l -= RADIX;
                carry = 1;
            } else {
                carry = 0;
            }
            self.1.push(l);
        }
        if carry > 0 {
            self.1.push(1);
        }
        self.normalize();
    }
    fn unsigned_sub_assign(&mut self, rhs: &Self) {
        if rhs.is_zero() {
            return;
        } else if self.is_zero() {
            self.0 = !rhs.0;
            self.1 = rhs.1.clone();
            return;
        }
        let less = self.1.len().saturating_sub(rhs.1.len());
        let mut a = self.1.iter_mut();
        let mut b = rhs.1.iter().chain(std::iter::repeat(&0).take(less));
        let mut zero = true;
        let mut carry = 0;
        for (l, &r) in a.by_ref().zip(b.by_ref()) {
            if zero {
                if r != 0 {
                    zero = false;
                    *l += RADIX - r;
                } else {
                    continue;
                }
            } else {
                *l += RADIX - 1 + carry - r;
            }
            if *l >= RADIX {
                *l -= RADIX;
                carry = 1;
            } else {
                carry = 0;
            }
        }
        for &r in b {
            let mut add;
            if zero {
                if r != 0 {
                    zero = false;
                    add = RADIX + carry - r;
                } else {
                    continue;
                }
            } else {
                add = RADIX - 1 + carry - r;
            }
            if add >= RADIX {
                add -= RADIX;
                carry = 1;
            } else {
                carry = 0;
            }
            self.1.push(add);
        }
        if carry == 0 {
            self.0 = !self.0;
            let mut a = self.1.iter_mut().skip_while(|v| **v == 0);
            if let Some(first) = a.next() {
                *first = RADIX - *first;
                for v in a {
                    *v = RADIX - 1 - *v;
                }
            }
        }
        self.normalize();
    }
}

struct NttParam {
    m: ModU64,
    u: u64,
    ui: u64,
    s: u32,
}

static NTT: &[NttParam] = &[
    NttParam {
        m: ModU64::new(1107296257),
        u: 1087287097,
        ui: 623044540,
        s: 25,
    },
    NttParam {
        m: ModU64::new(1711276033),
        u: 969788637,
        ui: 1790856,
        s: 25,
    },
];

impl NttParam {
    fn run(&self, a: &mut [u64], inv: bool) {
        let n = a.len();
        if n == 1 {
            return;
        }
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
                    let u = a[i + j];
                    let v = self.m.rem(a[i + j + kh] * w);
                    let mut s = u + v;
                    if s >= self.m.1 {
                        s -= self.m.1;
                    }
                    a[i + j] = s;
                    let mut d = u + self.m.1 - v;
                    if d >= self.m.1 {
                        d -= self.m.1;
                    }
                    a[i + j + kh] = d;
                    w = self.m.rem(w * wlen);
                }
            }
        }
        if inv {
            let p = self.m.1 as i64;
            let ni = ((egcd(n as i64, p).1 % p + p) % p) as u64;
            for x in a {
                *x = self.m.rem(*x as u64 * ni);
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
