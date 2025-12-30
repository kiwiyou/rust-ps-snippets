# Strongly Connected Components

returns (number of SCC's, SCC index of vertices).

```rust
impl Graph {
    fn scc(&self) -> (usize, Vec<u32>) {
        let v = self.head.len();
        let mut scc = vec![];
        scc.reserve_exact(v);
        scc.resize(v, u32::MAX);
        let mut stack = vec![];
        stack.reserve_exact(v);
        let mut dfs = vec![];
        dfs.reserve_exact(v);
        let mut i = v as u32 - 1;
        let mut component = 0;
        for u in 0..v {
            if scc[u] != u32::MAX {
                continue;
            }
            dfs.push(((u as u32) << 1, self.head[u]));
            scc[u] = i;
            i -= 1;
            while let Some((vu, eu)) = dfs.last_mut() {
                let u = *vu as usize >> 1;
                let is_root = *vu & 1 == 0;
                if let Some(&(ev, v)) = self.link.get(*eu as usize) {
                    *eu = ev;
                    if scc[v as usize] != u32::MAX {
                        if scc[v as usize] > scc[u] {
                            scc[u] = scc[v as usize];
                            *vu |= 1;
                        }
                        continue;
                    }
                    dfs.push((v << 1, self.head[v as usize]));
                    scc[v as usize] = i;
                    i -= 1;
                } else {
                    dfs.pop();
                    if is_root {
                        i += 1;
                        while let Some(&v) = stack.last() {
                            if scc[v as usize] > scc[u] {
                                break;
                            }
                            stack.pop();
                            scc[v as usize] = component;
                            i += 1;
                        }
                        scc[u as usize] = component;
                        component += 1;
                    } else {
                        stack.push(u as u32);
                    }
                    let v = u;
                    if let Some((vu, _)) = dfs.last_mut() {
                        let u = *vu as usize >> 1;
                        if scc[v] > scc[u] {
                            scc[u] = scc[v];
                            *vu |= 1;
                        }
                    }
                }
            }
        }
        (component as usize, scc)
    }
}
```
