# Shallowest Decomposition Tree

```rust,noplayground
fn decompose_tree(t: &Graph, root: usize) -> (usize, Graph) {
    let n = t.head.len();
    let mut result = Graph::new(n, n - 1);
    let mut stack = Graph::new(64 - n.leading_zeros() as usize, n);
    let mut extract_chain = |stack: &mut Graph, mut labels: u32, mut u: usize| {
        while labels != 0 {
            let label = labels.ilog2();
            labels ^= 1 << label;
            let back = stack.head[label as usize];
            let (next, v) = stack.link[back as usize];
            stack.head[label as usize] = next;
            result.connect(u, v as usize);
            u = v as usize;
        }
    };
    let mut forbidden = vec![0; n];
    let mut dfs = vec![(root as u32, u32::MAX, t.head[root], 0u32, 0u32)];
    let mut last_f = 0;
    while let Some((u, pu, eu, f1, f2)) = dfs.last_mut() {
        if let Some(&(ev, v)) = t.link.get(*eu as usize) {
            let now = *eu;
            *eu = ev;
            if now == *pu {
                continue;
            }
            dfs.push((v, now ^ 1, t.head[v as usize], 0, 0));
        } else {
            let fu = (*f1 | ((1 << (*f2 * 2 + 1).ilog2()) - 1)) + 1;
            forbidden[*u as usize] = fu;
            last_f = fu;
            let lu = fu.trailing_zeros();
            stack.connect(lu as usize, *u as usize);
            for (_, v) in t.neighbor(*u as usize) {
                extract_chain(&mut stack, forbidden[v] & ((1 << lu) - 1), *u as usize);
            }
            dfs.pop();
            let fv = fu;
            if let Some((_, _, _, f1, f2)) = dfs.last_mut() {
                *f2 |= *f1 & fv;
                *f1 |= fv;
            }
        }
    }
    let maxl = last_f.ilog2() as usize;
    let back = stack.head[maxl];
    let (next, root) = stack.link[back as usize];
    stack.head[maxl] = next;
    extract_chain(&mut stack, last_f & ((1 << maxl) - 1), root as usize);
    (root as usize, result)
}
```
