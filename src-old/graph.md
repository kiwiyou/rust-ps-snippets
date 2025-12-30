# Graph

Graphs are represented in **Compressed Sparse Row** format.
All edges on the graph are stored in a single array
such that edges with the same starting vertex are connected like a linked list.

- `link` stores (previous edge index, endpoint) tuples.
- `head` stores indices of edge list heads (or `u32::MAX` if none).

```rust
struct Graph {
    head: Vec<u32>,
    link: Vec<(u32, u32)>,
}

impl Graph {
    fn new(v: usize, e: usize) -> Self {
        let mut head = vec![];
        head.reserve_exact(v);
        head.resize(v, u32::MAX);
        let mut link = vec![];
        link.reserve_exact(e);
        Self { head, link }
    }
    fn connect(&mut self, from: usize, to: usize) {
        let prev = self.head[from];
        self.head[from] = self.link.len() as u32;
        self.link.push((prev, to as u32));
    }
    fn neighbor(&self, u: usize) -> Neighbor {
        Neighbor(self, self.head[u])
    }
}

struct Neighbor<'a>(&'a Graph, u32);

impl<'a> Iterator for Neighbor<'a> {
    // (edge index, endpoint)
    type Item = (usize, usize);
    fn next(&mut self) -> Option<Self::Item> {
        let e = self.1;
        let (next, endpoint) = *self.0.link.get(self.1 as usize)?;
        self.1 = next;
        Some((e as usize, endpoint as usize))
    }
}
```
