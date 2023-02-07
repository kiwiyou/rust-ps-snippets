# Linear Recurrence (Constant Coefficient)

Calculates nth element of linearly recurrent sequence {an}, given initial values and coefficients.

Time complexity: O(k³logn), where k is the length of coefficients.

```rust,noplayground
const M: u64 = 998244353;
const M32: u32 = M as u32;
fn recurrence(init: impl AsRef<[u32]>, coef: impl AsRef<[u32]>, n: usize) -> u32 {
    let init = init.as_ref();
    let coef = coef.as_ref();
    let k = init.len();
    assert_eq!(k, coef.len());
    if n < k {
        return init[n];
    }
    let mut acc = vec![0; k * k];
    for i in 0..k {
        acc[i * k + i] = 1;
    }
    let mut mult = vec![0; k * (k - 1)];
    for i in 1..k {
        mult[(i - 1) * k + i] = 1;
    }
    mult.extend_from_slice(coef);
    let mut aux = vec![0; k * k];
    let t = (n - k + 1..=n).min_by_key(|t| t.count_ones()).unwrap();
    for s in 0..64 - t.leading_zeros() {
        if t & (1 << s) != 0 {
            multiply(k, &acc, &mult, &mut aux);
            (acc, aux) = (aux, acc);
        }
        multiply(k, &mult, &mult, &mut aux);
        (mult, aux) = (aux, mult);
    }
    let mut result = 0;
    for (&y, &x) in init.iter().zip(&acc[(n - t) * k..]) {
        result += (y as u64 * x as u64 % M) as u32;
        if result >= M32 {
            result -= M32;
        }
    }
    result
}

fn multiply(n: usize, a: &[u32], b: &[u32], c: &mut [u32]) {
    for i in 0..n {
        for j in 0..n {
            c[i * n + j] = 0;
            for k in 0..n {
                c[i * n + j] += (a[i * n + k] as u64 * b[k * n + j] as u64 % M) as u32;
                if c[i * n + j] >= M32 {
                    c[i * n + j] -= M32;
                }
            }
        }
    }
}
```
