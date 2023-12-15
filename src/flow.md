# Push-Relabel Flow

```rust,noplayground
type Capacity = i32;
struct Flow {
    head: Vec<u32>,
    link: Vec<(u32, u32)>,
    f: Vec<Capacity>,
    x: Vec<Capacity>,
    next: Vec<i32>,
    last: Vec<i32>,
    gn: Vec<i32>,
    gp: Vec<i32>,
    ff: Vec<u32>,
    h: Vec<i32>,
    high: i32,
    high_gap: i32,
    work: usize,
}

impl Flow {
    fn new(v: usize, e: usize) -> Self {
        Self {
            head: vec![u32::MAX; v],
            link: Vec::with_capacity(e),
            f: Vec::with_capacity(e),
            x: Vec::with_capacity(e),
            gn: vec![],
            gp: vec![],
            h: vec![],
            high: 0,
            high_gap: 0,
            work: 0,
            next: vec![],
            last: vec![],
            ff: vec![],
        }
    }
    fn connect(&mut self, from: usize, to: usize, cap: Capacity, directed: bool) {
        let p = self.head[from];
        self.head[from] = self.link.len() as u32;
        self.link.push((p, to as u32));
        self.f.push(cap);
        let p = self.head[to];
        self.head[to] = self.link.len() as u32;
        self.link.push((p, from as u32));
        self.f.push(if directed { 0 } else { cap });
    }
    fn push_last(&mut self, h: i32, u: usize) {
        self.next[u] = self.last[h as usize];
        self.last[h as usize] = u as i32;
    }
    fn update_h(&mut self, u: usize, mut new_h: i32) {
        if self.h[u] as usize != self.head.len() {
            self.gn[self.gp[u] as usize] = self.gn[u];
            self.gp[self.gn[u] as usize] = self.gp[u];
        }
        self.h[u] = new_h as i32;
        if new_h == self.head.len() as i32 {
            return;
        }
        self.high_gap = self.high_gap.max(new_h);
        if self.x[u] > 0 {
            self.high = self.high.max(new_h);
            self.push_last(new_h, u);
        }
        new_h += self.head.len() as i32;
        self.gn[u] = self.gn[new_h as usize];
        self.gp[u] = new_h as i32;
        self.gn[new_h as usize] = u as i32;
        self.gp[self.gn[u] as usize] = u as i32;
    }
    fn global_relabel(&mut self, t: usize) {
        self.work = 0;
        self.h.clear();
        self.h
            .extend(std::iter::repeat(self.head.len() as i32).take(self.head.len()));
        self.last.clear();
        self.last.resize(self.head.len() + 1, -1);
        self.gn[..self.head.len()]
            .iter_mut()
            .enumerate()
            .for_each(|(i, v)| *v = i as i32);
        self.gp[..self.head.len()]
            .iter_mut()
            .enumerate()
            .for_each(|(i, v)| *v = i as i32);
        self.h[t] = 0;
        let mut q = vec![t as u32];
        let mut i = 0;
        while let Some(&u) = q.get(i) {
            let mut e = self.head[u as usize];
            while let Some(&(next, v)) = self.link.get(e as usize) {
                if self.h[v as usize] == self.head.len() as i32 && self.f[(e ^ 1) as usize] > 0 {
                    q.push(v);
                    self.update_h(v as usize, self.h[u as usize] + 1);
                }
                e = next;
            }
            self.high_gap = self.h[u as usize];
            self.high = self.high_gap;
            i += 1;
        }
    }
    fn push(&mut self, u: usize, v: usize, e: usize) {
        let df = self.x[u].min(self.f[e]);
        if df <= 0 {
            return;
        }
        if self.x[v] == 0 {
            self.push_last(self.h[v], v as usize);
        }
        self.f[e] -= df;
        self.f[e ^ 1] += df;
        self.x[u] -= df;
        self.x[v] += df;
    }
    fn discharge(&mut self, u: usize) {
        let mut new_h = self.head.len() as i32;
        let mut e = self.ff[u];
        while let Some(&(next, v)) = self.link.get(e as usize) {
            if self.f[e as usize] > 0 {
                if self.h[u] == self.h[v as usize] + 1 {
                    self.push(u, v as usize, e as usize);
                    if self.x[u] <= 0 {
                        self.ff[u] = e;
                        return;
                    }
                } else {
                    new_h = new_h.min(self.h[v as usize] + 1);
                }
            }
            e = next;
        }
        let mut e = self.head[u];
        while e != self.ff[u] {
            let (next, v) = self.link[e as usize];
            if self.f[e as usize] > 0 {
                if self.h[u] == self.h[v as usize] + 1 {
                    self.push(u, v as usize, e as usize);
                    if self.x[u] <= 0 {
                        self.ff[u] = e;
                        return;
                    }
                } else {
                    new_h = new_h.min(self.h[v as usize] + 1);
                }
            }
            e = next;
        }
        self.work += 1;
        let h = self.h[u] + self.head.len() as i32;
        if self.gn[self.gn[h as usize] as usize] != h {
            self.update_h(u, new_h);
        } else {
            let old = self.h[u];
            for h in old..=self.high_gap {
                let mut u = self.gn[(h + self.head.len() as i32) as usize] as usize;
                while u < self.head.len() {
                    self.h[u] = self.head.len() as i32;
                    u = self.gn[u] as usize;
                }
                let uh = h + self.head.len() as i32;
                self.gp[uh as usize] = uh;
                self.gn[uh as usize] = uh;
            }
            self.high_gap = old - 1;
        }
    }
    fn run(&mut self, s: usize, t: usize) -> Capacity {
        self.ff.clear();
        self.ff.extend_from_slice(&self.head);
        self.x.clear();
        self.x.resize(self.head.len(), 0);
        self.x[s] = Capacity::MAX;
        self.x[t] = -Capacity::MAX;
        self.gn.clear();
        self.gn.resize(self.head.len() * 2, 0);
        self.gp.clear();
        self.gp.resize(self.head.len() * 2, 0);
        self.next.clear();
        self.next.resize(self.head.len(), 0);
        self.global_relabel(t);
        let mut e = self.head[s];
        while let Some(&(next, v)) = self.link.get(e as usize) {
            self.push(s, v as usize, e as usize);
            e = next;
        }
        while self.high >= 0 {
            while self.last[self.high as usize] != -1 {
                let u = self.last[self.high as usize];
                self.last[self.high as usize] = self.next[u as usize];
                if self.h[u as usize] == self.high {
                    self.discharge(u as usize);
                    if self.work > 4 * self.head.len() {
                        self.global_relabel(t);
                    }
                }
            }
            self.high -= 1;
        }
        self.x[t] + i32::MAX
    }
}
```
