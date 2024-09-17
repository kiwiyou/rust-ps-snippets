# 2-SAT

```rust,noplayground
#[derive(Clone, Copy)]
enum Clause {
    Pos(usize),
    Neg(usize),
}

impl Clause {
    fn as_index(&self) -> usize {
        match self {
            Self::Pos(i) => i << 1 | 1,
            Self::Neg(i) => i << 1,
        }
    }

    fn inv(&self) -> Self {
        match *self {
            Self::Pos(i) => Self::Neg(i),
            Self::Neg(i) => Self::Pos(i),
        }
    }
}

struct SAT(Graph);

impl SAT {
    fn or(&mut self, l: Clause, r: Clause) {
        self.0.connect(l.inv().as_index(), r.as_index());
        self.0.connect(r.inv().as_index(), l.as_index());
    }

    fn imply(&mut self, l: Clause, r: Clause) {
        self.0.connect(l.as_index(), r.as_index());
        self.0.connect(r.inv().as_index(), l.inv().as_index());
    }

    fn try_assign(&self) -> Option<Vec<bool>> {
        let v = self.0.head.len();
        let mut scc = vec![];
        scc.reserve_exact(v);
        scc.resize(v, u32::MAX);
        let mut stack = vec![];
        stack.reserve_exact(v);
        let mut dfs = vec![];
        dfs.reserve_exact(v);
        let mut i = v as u32;
        let mut component = 0;
        for u in 0..v {
            if scc[u] != u32::MAX {
                continue;
            }
            dfs.push(((u as u32) << 1, self.0.head[u]));
            i -= 1;
            scc[u] = i;
            while let Some((vu, eu)) = dfs.last_mut() {
                let u = *vu as usize >> 1;
                let is_root = *vu & 1 == 0;
                if let Some(&(ev, v)) = self.0.link.get(*eu as usize) {
                    *eu = ev;
                    if scc[v as usize] != u32::MAX {
                        if scc[v as usize] > scc[u] {
                            scc[u] = scc[v as usize];
                            *vu |= 1;
                        }
                        continue;
                    }
                    dfs.push((v << 1, self.0.head[v as usize]));
                    i -= 1;
                    scc[v as usize] = i;
                } else {
                    dfs.pop();
                    if is_root {
                        i += 1;
                        while let Some(&v) = stack.last() {
                            if scc[v as usize] > scc[u] {
                                break;
                            }
                            if v as usize ^ u == 1 {
                                return None;
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
        Some(scc.chunks_exact(2).map(|c| c[0] > c[1]).collect())
    }
}
```
