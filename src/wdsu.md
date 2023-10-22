# Weighted Disjoint Set Union

```rust,noplayground
struct Wdsu<W, C> {
    up: Vec<(u32, W)>,
    e: W,
    combine: C,
}

impl<W, C> Wdsu<W, C>
where
    W: Copy,
    C: Fn(W, W) -> W,
{
    fn new(n: usize, e: W, combine: C) -> Self {
        Self {
            up: (0..n as u32).map(|i| (i, e)).collect(),
            e,
            combine,
        }
    }
    fn root(&mut self, u: usize) -> (usize, W) {
        let mut r = u;
        let mut w = self.e;
        while r != self.up[r].0 as usize {
            let (p, rw) = self.up[r];
            let (g, pw) = self.up[p as usize];
            self.up[r] = (g, (self.combine)(rw, pw));
            w = (self.combine)(w, self.up[r].1);
            r = g as usize;
        }
        (r, w)
    }
    fn attach(&mut self, p: usize, s: usize, w: W) {
        self.up[s] = (p as u32, w);
    }
}
```
