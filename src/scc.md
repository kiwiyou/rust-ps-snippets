# Strongly Connected Components

Uses [Path-based strong component algorithm](https://www.wikiwand.com/en/Path-based_strong_component_algorithm).

```rust,ignore
// let v = (number of vertices);
// let graph = (input graph);
// let begin = (beginning vertex);
let mut id = vec![u32::MAX; v];
let mut scc = vec![u32::MAX; v];
let mut s = vec![];
let mut p = vec![];
let mut c = 0;
let mut scc_id = 0;
dfs! {
    (graph, begin)
    |from, to, data, edge| => {
        id[from] = c;
        s.push(from);
        p.push(from);
        c += 1;
    } => if id[to] != u32::MAX {
        if scc[to] == u32::MAX {
            while let Some(&x) = p.last() {
                if id[x] > id[to] {
                    p.pop();
                } else {
                    break;
                }
            }
        }
        continue;
    } => recurse => {} => {
        if p.last() == Some(&from) {
            p.pop();
            while let Some(x) = s.pop() {
                scc[x] = scc_id;
                if x == from {
                    break;
                }
            }
            scc_id += 1;
        }
    }
}
```

