# Min Heap

- `pop()` - Returns (inserted index, key) pair.

```rs,noplayground
struct MinHeap<K> {
    k: Vec<(u32, K)>,
    pos: Vec<u32>,
    max: usize,
}

impl<K> MinHeap<K>
where
    K: PartialOrd + Copy,
{
    fn new() -> Self {
        Self {
            k: vec![],
            pos: vec![],
            max: 0,
        }
    }
    fn len(&self) -> usize {
        self.k.len()
    }
    fn push(&mut self, k: K) {
        let i = self.max;
        let len = self.len() as u32;
        self.max += 1;
        self.k.push((i as u32, k));
        self.pos.push(len);
        self.up(i);
    }
    fn pop(&mut self) -> Option<(usize, K)> {
        if self.len() == 0 {
            return None;
        }
        let (i, k) = self.k.swap_remove(0);
        if self.len() > 0 {
            self.pos[self.k[0].0 as usize] = 0;
            self.down(0);
        }
        Some((i as usize, k))
    }
    fn replace(&mut self, i: usize, k: K) -> K {
        use std::cmp::Ordering::*;
        let pos = self.pos[i] as usize;
        let ordering = self.k[pos].1.partial_cmp(&k).unwrap();
        let prev = std::mem::replace(&mut self.k[pos].1, k);
        match ordering {
            Greater => self.up(pos),
            Less => self.down(pos),
            Equal => {}
        }
        prev
    }
    fn up(&mut self, mut pos: usize) {
        while pos > 0 {
            let parent = (pos - 1) / 2;
            if self.k[pos].1 >= self.k[parent].1 {
                break;
            }
            self.k.swap(pos, parent);
            self.pos[self.k[pos].0 as usize] = pos as u32;
            pos = parent;
        }
        self.pos[self.k[pos].0 as usize] = pos as u32;
    }
    fn down(&mut self, mut pos: usize) {
        let len = self.len();
        loop {
            let child = pos * 2 + 1;
            if child >= len {
                break;
            }
            let less = if child + 1 == len || self.k[child].1 <= self.k[child + 1].1 {
                child
            } else {
                child + 1
            };
            if self.k[pos].1 <= self.k[less].1 {
                break;
            }
            self.k.swap(less, pos);
            self.pos[self.k[pos].0 as usize] = pos as u32;
            pos = less;
        }
        self.pos[self.k[pos].0 as usize] = pos as u32;
    }
}

impl<K> FromIterator<K> for MinHeap<K>
where
    K: PartialOrd + Copy,
{
    fn from_iter<T: IntoIterator<Item = K>>(iter: T) -> Self {
        let k: Vec<_> = iter
            .into_iter()
            .enumerate()
            .map(|(i, v)| (i as u32, v))
            .collect();
        let len = k.len();
        let pos = (0..len as u32).collect();
        let mut inst = Self { k, pos, max: len };
        for i in (0..inst.len()).rev() {
            inst.down(i);
        }
        inst
    }
}
```

## Example

Single Source Shortest Path (Dijkstra's)

```rs,noplayground
fn sssp(g: &Graph, w: &[u32], s: usize) -> Vec<u32> {
    let mut d = vec![u32::MAX; g.head.len()];
    d[s] = 0;
    let mut heap = d.iter().map(|&d| d).collect::<MinHeap<_>>();
    while let Some((u, du)) = heap.pop() {
        for (e, v) in g.neighbor(u) {
            let dv = du + w[e >> 1] as u32;
            if d[v] > dv {
                d[v] = dv;
                heap.replace(v, dv);
            }
        }
    }
    d
}
```
