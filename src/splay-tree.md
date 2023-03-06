# Splay Tree

Top-down Splay Tree, supports lazy operations.

```rust
trait SplayOp {
    type T;
    fn pull(_s: &mut Splay<Self>) {}
    fn push(_s: &mut Splay<Self>) {}
}

struct Splay<Op: SplayOp + ?Sized> {
    c: [Option<Box<Self>>; 2],
    k: u32,
    v: Op::T,
}

impl<Op: SplayOp> Splay<Op> {
    fn new(v: Op::T) -> Box<Self> {
        Box::new(Self {
            c: [None, None],
            k: 1,
            v,
        })
    }
    fn pull(&mut self) {
        Op::pull(self);
        let l = self.c[0].as_ref().map_or(0, |c| c.k);
        let r = self.c[1].as_ref().map_or(0, |c| c.k);
        self.k = l + r + 1;
    }
    fn push(&mut self) {
        Op::push(self);
    }
    fn split(&mut self, side: usize) -> Option<Box<Self>> {
        let c = self.c[side].take();
        self.pull();
        c
    }
    fn join(&mut self, side: usize, tree: Option<Box<Self>>) {
        assert!(self.c[side].is_none());
        self.c[side] = tree;
        self.pull();
    }
    fn index(self: Box<Self>, k: usize) -> Box<Self> {
        let mut k = k as u32;
        self.find(|s| {
            let l = s.c[0].as_ref().map_or(0, |c| c.k);
            match k.cmp(&l) {
                Equal => 2,
                Less => 0,
                Greater => {
                    k -= l + 1;
                    1
                }
            }
        })
    }
    fn find<F>(self: Box<Self>, mut f: F) -> Box<Self>
    where
        F: FnMut(&Self) -> usize,
    {
        let mut current = self;
        let mut tree = [vec![], vec![]];
        loop {
            current.push();
            let i = f(&current);
            if let Some(mut c) = current.c.get_mut(i).and_then(Option::take) {
                c.push();
                let j = f(&c);
                if let Some(cc) = c.c.get_mut(j).and_then(Option::take) {
                    if i == j {
                        let rotate = c.c[j ^ 1].take();
                        current.c[i] = rotate;
                        current.pull();
                        c.c[j ^ 1] = Some(current);
                        tree[j ^ 1].push(c);
                    } else {
                        tree[j].push(current);
                        tree[i].push(c);
                    }
                    current = cc;
                } else {
                    tree[i ^ 1].push(current);
                    current = c;
                    break;
                }
            } else {
                break;
            }
        }
        let [mut left, mut right] = current.c;
        let [ltree, rtree] = tree;
        for mut l in ltree.into_iter().rev() {
            l.c[1] = left;
            l.pull();
            left = Some(l);
        }
        for mut r in rtree.into_iter().rev() {
            r.c[0] = right;
            r.pull();
            right = Some(r);
        }
        current.c = [left, right];
        current.pull();
        current
    }
}
```
