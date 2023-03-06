# Heavy-Light Decomposition

Path traversing on heavy-light decomposition can be elegantly
represented with Rust Iterator.

```rust
struct Hld {
    size: Vec<u32>,
    parent: Vec<u32>,
    depth: Vec<u32>,
    chain: Vec<u32>,
    index: Vec<u32>,
}

impl Hld {
    fn make(g: &mut Graph, root: usize) -> Self {
        let v = g.head.len();
        let mut size = vec![1; v];
        let mut parent = (0..v as u32).collect::<Vec<_>>();
        let mut depth = vec![0; v];
        let mut dfs = vec![(g.head[root], root as u32, 0)];
        let mut d = 0;
        while let Some((e, u, _)) = dfs.last_mut() {
            if let Some(&(next, v)) = g.link.get(*e as usize) {
                if v == parent[*e as usize] {
                    *e = next;
                } else {
                    parent[v as usize] = *u;
                    d += 1;
                    depth[v as usize] = d;
                    dfs.push((g.head[v as usize], v, 0));
                }
            } else {
                let (ve, v, _) = dfs.pop().unwrap();
                if let Some((e, u, max)) = dfs.last_mut() {
                    d -= 1;
                    size[*u as usize] += size[v as usize];
                    if size[v as usize] > *max {
                        *max = size[v as usize];
                        let first = g.head[*u as usize] as usize;
                        (g.link[first].1, g.link[ve as usize].1) =
                            (g.link[ve as usize].1, g.link[first].1);
                    }
                    *e = g.link[*e as usize].0;
                }
            }
        }
        let mut chain = vec![0; v];
        let mut index = vec![u32::MAX; v];
        let mut heavy_dfs = vec![(g.head[root], root as u32)];
        let mut dfs = vec![];
        let mut i = 0;
        index[root as usize] = i;
        i += 1;
        loop {
            if let Some((e, r)) = heavy_dfs.pop() {
                if let Some(&(next, v)) = g.link.get(e as usize) {
                    chain[v as usize] = r;
                    index[v as usize] = i;
                    i += 1;
                    heavy_dfs.push((g.head[v as usize], r));
                    dfs.push(next);
                }
            } else if let Some(e) = dfs.last_mut() {
                if let Some(&(next, v)) = g.link.get(*e as usize) {
                    *e = next;
                    if index[v as usize] == u32::MAX {
                        chain[v as usize] = v;
                        index[v as usize] = i;
                        i += 1;
                        heavy_dfs.push((g.head[v as usize], v));
                    }
                } else {
                    dfs.pop();
                }
            } else {
                break;
            }
        }
        Self {
            size,
            parent,
            depth,
            chain,
            index,
        }
    }
    fn path(&self, u: usize, v: usize) -> HldPath {
        HldPath(self, Some((u, v)))
    }
}

struct HldPath<'a>(&'a Hld, Option<(usize, usize)>);

impl<'a> Iterator for HldPath<'a> {
    // (upper (thus lower index) node, lower node)
    type Item = (usize, usize);
    fn next(&mut self) -> Option<Self::Item> {
        let (mut u, mut v) = self.1?;
        if self.0.chain[u] == self.0.chain[v] {
            if self.0.depth[u] > self.0.depth[v] {
                (u, v) = (v, u);
            }
            self.1 = None;
            Some((u, v))
        } else {
            let ru = self.0.chain[u] as usize;
            let mut rv = self.0.chain[v] as usize;
            if self.0.depth[ru] > self.0.depth[rv] {
                (u, v, rv) = (v, u, ru);
            }
            self.1 = Some((u, self.0.parent[rv] as usize));
            Some((rv, v))
        }
    }
}
```
