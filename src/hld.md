# Heavy-Light Decomposition

Path traversing on heavy-light decomposition can be elegantly
represented with Rust Iterator.

```rust
struct Hld {
    p: Vec<u32>,
    d: Vec<u32>,
    r: Vec<u32>,
}

impl Graph {
    fn hld(&self, root: usize) -> Hld {
        let n = self.head.len();
        let mut d = vec![0; n];
        let mut p = vec![0; n];
        p[root] = root as u32;
        let mut bfs = vec![(root as u32, 0, 1, 0)];
        let mut front = 0;
        let mut depth = 0;
        while front < bfs.len() {
            let back = bfs.len();
            for i in front..back {
                let u = bfs[i].0 as usize;
                let pu = p[u];
                d[u] = depth;
                for (_, v) in self.neighbor(u) {
                    if v == pu as usize {
                        continue;
                    }
                    bfs.push((v as u32, i as u32, 1, 0));
                    p[v] = u as u32;
                }
            }
            front = back;
            depth += 1;
        }
        let bfs = &mut bfs[..];
        for i in (1..bfs.len()).rev() {
            let (_, p, sz, _) = bfs[i];
            let (_, _, usz, umax) = &mut bfs[p as usize];
            *usz += sz;
            *umax = sz.max(*umax);
        }
        let mut r = vec![0; n];
        for i in 1..bfs.len() {
            let (v, p, sz, _) = bfs[i];
            let (u, _, _, umax) = &mut bfs[p as usize];
            if sz == *umax {
                r[v as usize] = r[*u as usize];
                *umax = u32::MAX;
            } else {
                r[v as usize] = v;
            }
        }
        Hld { p, d, r }
    }
}

impl Hld {
    fn path(&self, u: usize, v: usize) -> HldPath {
        HldPath { hld: self, u, v }
    }
}

struct HldPath<'a> {
    hld: &'a Hld,
    u: usize,
    v: usize,
}

impl Iterator for HldPath<'_> {
    // (upper, lower)
    type Item = (usize, usize);

    fn next(&mut self) -> Option<Self::Item> {
        if self.u == usize::MAX {
            return None;
        }
        let ru = self.hld.r[self.u] as usize;
        let mut rv = self.hld.r[self.v] as usize;
        if ru == rv {
            let ret = if self.hld.d[self.u] > self.hld.d[self.v] {
                (self.v, self.u)
            } else {
                (self.u, self.v)
            };
            self.u = usize::MAX;
            Some(ret)
        } else {
            if self.hld.d[ru] > self.hld.d[rv] {
                (rv, self.u, self.v) = (ru, self.v, self.u);
            }
            self.v = self.hld.p[rv] as usize;
            Some((rv, self.v))
        }
    }
}
```
