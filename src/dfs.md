# Depth-First Search

```rust,noplayground
mod dfs {
    macro_rules! dfs {
        {
            ($g:ident, $node:expr)
            |$from:ident, $to:ident, $data:ident, $edge:ident| =>
            $begin:expr => $before:expr => recurse => $after:expr => $end:expr
        } => {
            let $from: usize = $node;
            $begin;
            let from = $from as u32;
            let mut stack = vec![(from, $g.head[$from])];
            #[allow(unused_variables)]
            while let Some(&mut (from, ref mut edge)) = stack.last_mut() {
                let $from = from as usize;
                let $edge = *edge as usize;
                if let Some(&(next, to, ref $data)) = $g.edge.get($edge) {
                    let $to = to as usize;
                    let prev = *edge;
                    *edge = next;
                    $before;
                    *edge = prev;
                    let $from = $to;
                    $begin;
                    stack.push((to, $g.head[$to]));
                } else {
                    stack.pop();
                    if let Some(&mut (from, ref mut edge)) = stack.last_mut() {
                        let $edge = *edge as usize;
                        let (next, to, $data) = $g.edge[$edge];
                        *edge = next;
                        $end;
                        let $from = from as usize;
                        let $to = to as usize;
                        $after;
                    } else {
                        $end;
                    }
                }
            }
        }
    }
    pub(crate) use dfs;
}
use dfs::dfs;
```

## Example

```rust
# fn main() {
let mut graph = Graph::with_capacity(4, 6);
graph.connect(0, 1, "0 -> 1");
graph.connect(1, 0, "1 -> 0");
graph.connect(1, 2, "1 -> 2");
graph.connect(1, 3, "1 -> 3");
graph.connect(3, 0, "3 -> 0");
graph.connect(3, 2, "3 -> 2");
let mut visited = vec![false; 4];
dfs! {
    (graph, 0)
    |from, to, data, edge| => {
        visited[from] = true;
    } => if visited[to] {
        continue;
    } else {
        println!("{data}");
    } => recurse => {
        println!("After {data}");
    } => {
        println!("Finished visiting {from}");
    }
}
# }
# 
# struct Graph<T> {
#     head: Vec<u32>,
#     edge: Vec<(u32, u32, T)>,
# }
# 
# impl<T> Graph<T> {
#     fn with_capacity(v: usize, e: usize) -> Self {
#         Self {
#             head: vec![u32::MAX; v],
#             edge: Vec::with_capacity(e),
#         }
#     }
# 
#     fn connect(&mut self, from: usize, to: usize, data: T) {
#         let next = self.head[from];
#         self.head[from] = self.edge.len() as u32;
#         self.edge.push((next, to as u32, data));
#     }
# 
#     fn neighbor(&self, from: usize) -> Neighbor<T> {
#         Neighbor(self, self.head[from])
#     }
# }
# 
# struct Neighbor<'g, T>(&'g Graph<T>, u32);
# 
# impl<'g, T> Iterator for Neighbor<'g, T> {
#     type Item = (usize, &'g T);
# 
#     fn next(&mut self) -> Option<Self::Item> {
#         let &(next, to, ref data) = self.0.edge.get(self.1 as usize)?;
#         self.1 = next;
#         Some((to as usize, data))
#     }
# }
# 
# mod dfs {
#     macro_rules! dfs {
#         {
#             ($g:ident, $node:expr)
#             |$from:ident, $to:ident, $data:ident, $edge:ident| =>
#             $begin:expr => $before:expr => recurse => $after:expr => $end:expr
#         } => {
#             let $from: usize = $node;
#             $begin;
#             let from = $from as u32;
#             let mut stack = vec![(from, $g.head[$from])];
#             #[allow(unused_variables)]
#             while let Some(&mut (from, ref mut edge)) = stack.last_mut() {
#                 let $from = from as usize;
#                 let $edge = *edge as usize;
#                 if let Some(&(next, to, ref $data)) = $g.edge.get($edge) {
#                     let $to = to as usize;
#                     let prev = *edge;
#                     *edge = next;
#                     $before;
#                     *edge = prev;
#                     let $from = $to;
#                     $begin;
#                     stack.push((to, $g.head[$to]));
#                 } else {
#                     stack.pop();
#                     if let Some(&mut (from, ref mut edge)) = stack.last_mut() {
#                         let $edge = *edge as usize;
#                         let (next, to, $data) = $g.edge[$edge];
#                         *edge = next;
#                         $end;
#                         let $from = from as usize;
#                         let $to = to as usize;
#                         $after;
#                     } else {
#                         $end;
#                     }
#                 }
#             }
#         }
#     }
#     pub(crate) use dfs;
# }
# use dfs::dfs;
```
