# Adjacency Array

Graphs are represented with **Adjacency Array**s.
All edges on the graph are stored in a single array
such that edges with the same starting vertex are connected like a linked list.

- `edge` stores 3-tuples of next edge indices (or `u32::MAX` if none), endpoints, edge data.
- `head` stores indices of edge list heads (or `u32::MAX` if none).

```rust,noplayground
struct Graph<T> {
    head: Vec<u32>,
    edge: Vec<(u32, u32, T)>,
}

impl<T> Graph<T> {
    fn with_capacity(v: usize, e: usize) -> Self {
        Self {
            head: vec![u32::MAX; v],
            edge: Vec::with_capacity(e),
        }
    }

    fn connect(&mut self, from: usize, to: usize, data: T) {
        let next = self.head[from];
        self.head[from] = self.edge.len() as u32;
        self.edge.push((next, to as u32, data));
    }

    fn neighbor(&self, from: usize) -> Neighbor<T> {
        Neighbor(self, self.head[from])
    }
}

struct Neighbor<'g, T>(&'g Graph<T>, u32);

impl<'g, T> Iterator for Neighbor<'g, T> {
    type Item = (usize, &'g T);

    fn next(&mut self) -> Option<Self::Item> {
        let &(next, to, ref data) = self.0.edge.get(self.1 as usize)?;
        self.1 = next;
        Some((to as usize, data))
    }
}
```
