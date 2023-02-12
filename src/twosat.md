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
 
#[derive(Default)]
struct SAT {
    head: Vec<u32>,
    link: Vec<u32>,
    end: Vec<u32>,
}
 
impl SAT {
    fn reserve_clause(&mut self, n: usize) {
        self.head.resize(self.head.len() + n * 2, u32::MAX);
    }
 
    fn or(&mut self, l: Clause, r: Clause) {
        self.connect(l.inv().as_index(), r.as_index());
        self.connect(r.inv().as_index(), l.as_index());
    }
 
    fn imply(&mut self, l: Clause, r: Clause) {
        self.connect(l.as_index(), r.as_index());
        self.connect(r.inv().as_index(), l.inv().as_index());
    }
 
    fn connect(&mut self, from: usize, to: usize) {
        let p = self.head[from];
        self.head[from] = self.link.len() as u32;
        self.link.push(p);
        self.end.push(to as u32);
    }
 
    fn try_assign(&self) -> Option<Vec<bool>> {
        let n = self.head.len();
        let mut c = 0;
        let mut s = vec![];
        let mut p = vec![];
        let mut pre = vec![u32::MAX; n];
        let mut comp = vec![u32::MAX; n];
        let mut next = 0;
        for i in 0..n {
            if pre[i] != u32::MAX {
                continue;
            }
            pre[i] = c;
            c += 1;
            let mut dfs = vec![(i as u32, self.head[i])];
            s.push(i as u32);
            p.push(i as u32);
            while let Some((u, e)) = dfs.last_mut() {
                if let Some(&v) = self.end.get(*e as usize) {
                    if pre[v as usize] == u32::MAX {
                        pre[v as usize] = c;
                        c += 1;
                        s.push(v);
                        p.push(v);
                        dfs.push((v, self.head[v as usize]));
                        continue;
                    } else if comp[v as usize] == u32::MAX {
                        while let Some(&w) = p.last() {
                            if pre[w as usize] <= pre[v as usize] {
                                break;
                            }
                            p.pop();
                        }
                    }
                    *e = self.link[*e as usize];
                } else {
                    if Some(&*u) == p.last() {
                        p.pop();
                        while let Some(v) = s.pop() {
                            if comp[v as usize ^ 1] == next {
                                return None;
                            }
                            comp[v as usize] = next;
                            if v == *u {
                                break;
                            }
                        }
                        next += 1;
                    }
                    dfs.pop();
                    if let Some((_, e)) = dfs.last_mut() {
                        *e = self.link[*e as usize];
                    }
                }
            }
        }
        Some(comp.chunks(2).map(|c| c[0] > c[1]).collect())
    }
}
```
